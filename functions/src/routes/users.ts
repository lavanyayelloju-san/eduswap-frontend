import { Request, Response } from 'express';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { z } from 'zod';
import { updateProfileSchema } from '../types/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError
} from '../utils/errors';
import { logger } from '../utils/logger';
import { processImageUpload } from '../services/fileUpload';

const db = getFirestore(getApp());
const storage = getStorage(getApp());

export async function userRoutes(req: Request, res: Response) {
  const path = req.path.replace('/api/users', '') || '/';

  try {
    // Apply authentication middleware
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req as AuthenticatedRequest, res, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    switch (req.method) {
      case 'GET':
        if (path === '/me') {
          return await handleGetCurrentUser(req as AuthenticatedRequest, res);
        } else if (path.match(/^\/[^\/]+$/)) {
          const userId = path.substring(1);
          return await handleGetUser(req as AuthenticatedRequest, res, userId);
        }
        break;

      case 'PUT':
        if (path === '/me') {
          return await handleUpdateUser(req as AuthenticatedRequest, res);
        }
        break;

      case 'POST':
        if (path === '/upload-avatar') {
          return await handleUploadAvatar(req as AuthenticatedRequest, res);
        }
        break;

      default:
        return res.status(405).json({
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Method not allowed'
          }
        });
    }

    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User endpoint not found'
      }
    });
  } catch (error: any) {
    logger.error('User route error', { error: error.message, path, method: req.method });
    throw error;
  }
}

async function handleGetCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      throw new NotFoundError('User');
    }

    const userData = userDoc.data()!;

    // Update last active timestamp
    await db.collection('users').doc(req.user.id).update({
      lastActive: new Date()
    });

    return res.status(200).json({
      success: true,
      data: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        rollNumber: userData.rollNumber,
        avatarUrl: userData.avatarUrl,
        status: userData.status,
        trustScore: userData.trustScore,
        savedItems: userData.savedItems || [],
        bio: userData.bio,
        course: userData.course,
        createdAt: userData.createdAt,
        lastActive: new Date()
      }
    });

  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      throw error;
    }
    throw error;
  }
}

async function handleGetUser(req: AuthenticatedRequest, res: Response, userId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new NotFoundError('User');
    }

    const userData = userDoc.data()!;

    // Get user's public resources count
    const resourcesQuery = await db.collection('resources')
      .where('ownerId', '==', userId)
      .get();
    const resourcesCount = resourcesQuery.size;

    // Return only public profile information
    const publicProfile = {
      id: userData.id,
      name: userData.name,
      username: userData.username,
      avatarUrl: userData.avatarUrl,
      status: userData.status === 'verified' ? 'verified' : 'pending', // Only show if verified
      trustScore: userData.trustScore,
      bio: userData.bio,
      course: userData.course,
      createdAt: userData.createdAt,
      resourcesCount: resourcesCount,
      joinDate: userData.createdAt
    };

    return res.status(200).json({
      success: true,
      data: publicProfile
    });

  } catch (error: any) {
    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      throw error;
    }
    throw error;
  }
}

async function handleUpdateUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      throw new NotFoundError('User');
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updatedAt: new Date()
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.bio !== undefined) {
      updateData.bio = validatedData.bio;
    }
    if (validatedData.course !== undefined) {
      updateData.course = validatedData.course;
    }

    // Update user document
    await db.collection('users').doc(req.user.id).update(updateData);

    // Get updated user data
    const updatedUserDoc = await db.collection('users').doc(req.user.id).get();
    const updatedUserData = updatedUserDoc.data()!;

    logger.info('User profile updated', {
      userId: req.user.id,
      updatedFields: Object.keys(validatedData)
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: {
          id: updatedUserData.id,
          name: updatedUserData.name,
          username: updatedUserData.username,
          email: updatedUserData.email,
          rollNumber: updatedUserData.rollNumber,
          avatarUrl: updatedUserData.avatarUrl,
          status: updatedUserData.status,
          trustScore: updatedUserData.trustScore,
          savedItems: updatedUserData.savedItems || [],
          bio: updatedUserData.bio,
          course: updatedUserData.course,
          createdAt: updatedUserData.createdAt,
          updatedAt: updatedUserData.updatedAt
        }
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid update data');
    }

    if (error instanceof AuthenticationError || error instanceof NotFoundError) {
      throw error;
    }

    throw error;
  }
}

async function handleUploadAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Handle file upload using busboy
    const result = await processImageUpload(req, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 2 * 1024 * 1024, // 2MB
      dimensions: { width: 400, height: 400 },
      aspectRatio: '1:1',
      prefix: 'avatars',
      userId: req.user.id
    });

    if (!result.success) {
      throw new ValidationError(result.error || 'Upload failed');
    }

    // Update user's avatar URL
    await db.collection('users').doc(req.user.id).update({
      avatarUrl: result.fileUrl,
      updatedAt: new Date()
    });

    logger.info('Avatar uploaded successfully', {
      userId: req.user.id,
      fileUrl: result.fileUrl
    });

    return res.status(200).json({
      success: true,
      data: {
        avatarUrl: result.fileUrl,
        message: 'Avatar uploaded successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      throw error;
    }

    logger.error('Avatar upload error', { error: error.message, userId: req.user?.id });
    throw error;
  }
}