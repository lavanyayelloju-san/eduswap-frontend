import { Request } from 'express';
import { getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import sharp from 'sharp';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

interface FileUploadOptions {
  allowedTypes: string[];
  maxSize: number;
  dimensions?: { width: number; height: number };
  aspectRatio?: '1:1' | 'any';
  prefix: string;
  userId: string;
}

interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  error?: string;
}

export async function processImageUpload(
  req: Request,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  return new Promise((resolve) => {
    const storage = getStorage(getApp());
    const bucket = storage.bucket();

    let fileData: Buffer | null = null;
    let fileName: string = '';
    let mimeType: string = '';
    let fileSize: number = 0;

    const busboy = Busboy({ headers: req.headers });

    // Set timeout for upload
    const timeout = setTimeout(() => {
      req.unpipe(busboy);
      resolve({
        success: false,
        error: 'Upload timeout'
      });
    }, 30000); // 30 seconds

    busboy.on('file', (fieldname, file, { filename, mimeType: fileMimeType }) => {
      if (fieldname !== 'file') {
        file.resume();
        return;
      }

      // Validate file type
      if (!options.allowedTypes.includes(fileMimeType)) {
        file.resume();
        clearTimeout(timeout);
        resolve({
          success: false,
          error: `Invalid file type. Allowed: ${options.allowedTypes.join(', ')}`
        });
        return;
      }

      fileName = filename;
      mimeType = fileMimeType;
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
        fileSize += chunk.length;

        // Check file size
        if (fileSize > options.maxSize) {
          file.resume();
          clearTimeout(timeout);
          resolve({
            success: false,
            error: `File too large. Max size: ${formatBytes(options.maxSize)}`
          });
        }
      });

      file.on('end', () => {
        fileData = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', async () => {
      clearTimeout(timeout);

      if (!fileData) {
        resolve({
          success: false,
          error: 'No file uploaded'
        });
        return;
      }

      try {
        // Process image with sharp
        let processedImage = sharp(fileData);

        // Get image metadata
        const metadata = await processedImage.metadata();

        // Validate dimensions if specified
        if (options.dimensions) {
          if (metadata.width! < options.dimensions.width ||
              metadata.height! < options.dimensions.height) {
            resolve({
              success: false,
              error: `Image too small. Minimum: ${options.dimensions.width}x${options.dimensions.height}`
            });
            return;
          }
        }

        // Validate aspect ratio if specified
        if (options.aspectRatio === '1:1') {
          const ratio = metadata.width! / metadata.height!;
          if (Math.abs(ratio - 1) > 0.1) {
            resolve({
              success: false,
              error: 'Invalid aspect ratio. Expected: 1:1'
            });
            return;
          }
        }

        // Resize and optimize
        if (options.dimensions) {
          processedImage = processedImage
            .resize(options.dimensions.width, options.dimensions.height, {
              fit: 'cover',
              position: 'center'
            });
        }

        // Convert to WebP for better compression
        if (mimeType !== 'image/webp') {
          processedImage = processedImage.webp({ quality: 85 });
        }

        const processedBuffer = await processedImage.toBuffer();

        // Generate unique filename
        const fileExtension = mimeType === 'image/webp' ? 'webp' :
          fileName.split('.').pop() || 'jpg';
        const uniqueFileName = `${options.prefix}/${options.userId}/${uuidv4()}.${fileExtension}`;

        // Upload to Firebase Storage
        const file = bucket.file(uniqueFileName);

        await file.save(processedBuffer, {
          metadata: {
            contentType: 'image/webp',
            metadata: {
              originalName: fileName,
              uploadedBy: options.userId,
              uploadedAt: new Date().toISOString()
            }
          }
        });

        // Make file public
        await file.makePublic();

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

        logger.info('File uploaded successfully', {
          fileName: uniqueFileName,
          userId: options.userId,
          size: processedBuffer.length
        });

        resolve({
          success: true,
          fileUrl: fileUrl,
          fileName: uniqueFileName,
          mimeType: 'image/webp',
          size: processedBuffer.length
        });

      } catch (error: any) {
        logger.error('Image processing error', { error: error.message });
        resolve({
          success: false,
          error: 'Image processing failed'
        });
      }
    });

    busboy.on('error', (error) => {
      clearTimeout(timeout);
      logger.error('Busboy error', { error: error.message });
      resolve({
        success: false,
        error: 'Upload processing failed'
      });
    });

    // Pipe the request to busboy
    req.pipe(busboy);
  });
}

export async function processFileUpload(
  req: Request,
  options: {
    allowedTypes: string[];
    maxSize: number;
    prefix: string;
    userId: string;
    resourceId?: string;
  }
): Promise<FileUploadResult> {
  return new Promise((resolve) => {
    const storage = getStorage(getApp());
    const bucket = storage.bucket();

    let fileData: Buffer | null = null;
    let fileName: string = '';
    let mimeType: string = '';
    let fileSize: number = 0;

    const busboy = Busboy({ headers: req.headers });

    const timeout = setTimeout(() => {
      req.unpipe(busboy);
      resolve({
        success: false,
        error: 'Upload timeout'
      });
    }, 60000); // 60 seconds for larger files

    busboy.on('file', (fieldname, file, { filename, mimeType: fileMimeType }) => {
      if (fieldname !== 'file') {
        file.resume();
        return;
      }

      // Validate file type
      if (!options.allowedTypes.includes(fileMimeType)) {
        file.resume();
        clearTimeout(timeout);
        resolve({
          success: false,
          error: `Invalid file type. Allowed: ${options.allowedTypes.join(', ')}`
        });
        return;
      }

      fileName = filename;
      mimeType = fileMimeType;
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
        fileSize += chunk.length;

        // Check file size
        if (fileSize > options.maxSize) {
          file.resume();
          clearTimeout(timeout);
          resolve({
            success: false,
            error: `File too large. Max size: ${formatBytes(options.maxSize)}`
          });
        }
      });

      file.on('end', () => {
        fileData = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', async () => {
      clearTimeout(timeout);

      if (!fileData) {
        resolve({
          success: false,
          error: 'No file uploaded'
        });
        return;
      }

      try {
        // Generate unique filename
        const fileExtension = fileName.split('.').pop() || 'pdf';
        const uniqueFileName = `${options.prefix}/${options.resourceId || options.userId}/${uuidv4()}.${fileExtension}`;

        // Upload to Firebase Storage
        const file = bucket.file(uniqueFileName);

        await file.save(fileData, {
          metadata: {
            contentType: mimeType,
            metadata: {
              originalName: fileName,
              uploadedBy: options.userId,
              uploadedAt: new Date().toISOString(),
              ...(options.resourceId && { resourceId: options.resourceId })
            }
          }
        });

        // Make file public
        await file.makePublic();

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

        logger.info('File uploaded successfully', {
          fileName: uniqueFileName,
          userId: options.userId,
          size: fileData.length,
          mimeType: mimeType
        });

        resolve({
          success: true,
          fileUrl: fileUrl,
          fileName: uniqueFileName,
          mimeType: mimeType,
          size: fileData.length
        });

      } catch (error: any) {
        logger.error('File upload error', { error: error.message });
        resolve({
          success: false,
          error: 'File upload failed'
        });
      }
    });

    busboy.on('error', (error) => {
      clearTimeout(timeout);
      logger.error('Busboy error', { error: error.message });
      resolve({
        success: false,
        error: 'Upload processing failed'
      });
    });

    req.pipe(busboy);
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}