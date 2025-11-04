import { Request, Response } from 'express';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  createResourceSchema,
  resourceQuerySchema,
  borrowRequestSchema
} from '../types/validation';
import {
  authenticateToken,
  requireVerified,
  AuthenticatedRequest,
  requireOwnership
} from '../middleware/auth';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError
} from '../utils/errors';
import { logger } from '../utils/logger';
import { processImageUpload, processFileUpload } from '../services/fileUpload';

const db = getFirestore(getApp());

export async function resourceRoutes(req: Request, res: Response) {
  const path = req.path.replace('/api/resources', '') || '/';

  try {
    // Apply authentication middleware
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req as AuthenticatedRequest, res, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    switch (req.method) {
      case 'POST':
        if (path === '/') {
          return await handleCreateResource(req as AuthenticatedRequest, res);
        }
        break;

      case 'GET':
        if (path === '/') {
          return await handleGetResources(req as AuthenticatedRequest, res);
        } else if (path.match(/^\/[^\/]+$/)) {
          const resourceId = path.substring(1);
          return await handleGetResource(req as AuthenticatedRequest, res, resourceId);
        } else if (path.match(/^\/([^\/]+)\/comments$/)) {
          const resourceId = path.substring(1, path.indexOf('/comments'));
          return await handleGetResourceComments(req as AuthenticatedRequest, res, resourceId);
        }
        break;

      case 'DELETE':
        if (path.match(/^\/[^\/]+$/)) {
          const resourceId = path.substring(1);
          // Apply ownership middleware
          await new Promise<void>((resolve, reject) => {
            requireOwnership()(req as AuthenticatedRequest, res, (error) => {
              if (error) return reject(error);
              resolve();
            });
          });
          return await handleDeleteResource(req as AuthenticatedRequest, res, resourceId);
        }
        break;

      case 'POST':
        if (path.match(/^\/([^\/]+)\/save$/)) {
          const resourceId = path.substring(1, path.indexOf('/save'));
          return await handleToggleSaveResource(req as AuthenticatedRequest, res, resourceId);
        } else if (path.match(/^\/([^\/]+)\/borrow$/)) {
          const resourceId = path.substring(1, path.indexOf('/borrow'));
          return await handleBorrowResource(req as AuthenticatedRequest, res, resourceId);
        } else if (path.match(/^\/([^\/]+)\/comments$/)) {
          const resourceId = path.substring(1, path.indexOf('/comments'));
          return await handleAddComment(req as AuthenticatedRequest, res, resourceId);
        }
        break;
    }

    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource endpoint not found'
      }
    });
  } catch (error: any) {
    logger.error('Resource route error', { error: error.message, path, method: req.method });
    throw error;
  }
}

async function handleCreateResource(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Require verified user
    if (!req.user.isVerified) {
      throw new AuthorizationError('Account verification required to create resources');
    }

    const validatedData = createResourceSchema.parse(req.body);

    // Generate tags automatically
    const tags = [
      validatedData.course.toLowerCase().trim(),
      validatedData.subject.toLowerCase().trim(),
      validatedData.itemType.toLowerCase().replace(/\s+/g, '_'),
      ...(validatedData.tags || [])
    ].filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates

    // Create resource document
    const resourceData = {
      title: validatedData.title,
      description: validatedData.description,
      course: validatedData.course,
      subject: validatedData.subject,
      itemType: validatedData.itemType,
      resourceType: validatedData.resourceType,
      availability: 'Available',
      tags: tags,
      ownerId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      requestCount: 0,
      ...(validatedData.meetupLocation && { meetupLocation: validatedData.meetupLocation }),
      ...(validatedData.deadline && { deadline: new Date(validatedData.deadline) })
    };

    // Create resource in Firestore
    const resourceRef = await db.collection('resources').add(resourceData);
    const resourceId = resourceRef.id;

    // Handle file uploads if present
    let imageUrl: string | undefined;
    let fileUrl: string | undefined;
    let fileMimeType: string | undefined;

    // Check if there are files to upload
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      try {
        // Upload cover image if present
        if (req.body.image || req.files?.image) {
          const imageResult = await processImageUpload(req, {
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            maxSize: 5 * 1024 * 1024, // 5MB
            dimensions: { width: 1200, height: 800 },
            aspectRatio: 'any',
            prefix: 'resources',
            userId: req.user.id
          });

          if (imageResult.success && imageResult.fileUrl) {
            imageUrl = imageResult.fileUrl;
          }
        }

        // Upload file if present (for digital resources)
        if (validatedData.resourceType === 'Digital' && (req.body.file || req.files?.file)) {
          const fileResult = await processFileUpload(req, {
            allowedTypes: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ],
            maxSize: 20 * 1024 * 1024, // 20MB
            prefix: 'resources',
            userId: req.user.id,
            resourceId: resourceId
          });

          if (fileResult.success && fileResult.fileUrl) {
            fileUrl = fileResult.fileUrl;
            fileMimeType = fileResult.mimeType;
          }
        }
      } catch (uploadError: any) {
        logger.error('File upload error during resource creation', {
          error: uploadError.message,
          resourceId
        });
        // Don't fail the entire operation if file upload fails
      }
    }

    // Update resource with file URLs
    const updateData: any = { updatedAt: new Date() };
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (fileUrl) updateData.fileUrl = fileUrl;
    if (fileMimeType) updateData.fileMimeType = fileMimeType;

    if (Object.keys(updateData).length > 1) {
      await resourceRef.update(updateData);
    }

    // Get the complete resource with owner details
    const resourceDoc = await resourceRef.get();
    const resource = resourceDoc.data()!;

    // Get owner details
    const ownerDoc = await db.collection('users').doc(req.user.id).get();
    const owner = ownerDoc.data()!;

    logger.info('Resource created successfully', {
      resourceId,
      title: validatedData.title,
      userId: req.user.id,
      resourceType: validatedData.resourceType
    });

    return res.status(201).json({
      success: true,
      data: {
        id: resourceId,
        title: resource.title,
        description: resource.description,
        course: resource.course,
        subject: resource.subject,
        itemType: resource.itemType,
        resourceType: resource.resourceType,
        availability: resource.availability,
        imageUrl: resource.imageUrl,
        fileUrl: resource.fileUrl,
        fileMimeType: resource.fileMimeType,
        tags: resource.tags,
        meetupLocation: resource.meetupLocation,
        deadline: resource.deadline,
        createdAt: resource.createdAt,
        owner: {
          id: owner.id,
          name: owner.name,
          avatarUrl: owner.avatarUrl,
          trustScore: owner.trustScore
        }
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid resource data');
    }

    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error;
    }

    throw error;
  }
}

async function handleGetResources(req: AuthenticatedRequest, res: Response) {
  try {
    const validatedQuery = resourceQuerySchema.parse(req.query);

    let query = db.collection('resources');

    // Apply filters
    if (validatedQuery.course) {
      query = query.where('course', '==', validatedQuery.course);
    }

    if (validatedQuery.itemType) {
      query = query.where('itemType', '==', validatedQuery.itemType);
    }

    if (validatedQuery.resourceType) {
      query = query.where('resourceType', '==', validatedQuery.resourceType);
    }

    if (validatedQuery.availability) {
      query = query.where('availability', '==', validatedQuery.availability);
    }

    if (validatedQuery.ownerId) {
      query = query.where('ownerId', '==', validatedQuery.ownerId);
    }

    if (validatedQuery.tags && validatedQuery.tags.length > 0) {
      query = query.where('tags', 'array-contains-any', validatedQuery.tags);
    }

    // Text search (basic implementation)
    if (validatedQuery.q) {
      // In a real implementation, you might use Algolia or Firestore's full-text search
      // For now, we'll do a basic filter by title
      query = query.where('title', '>=', validatedQuery.q)
                   .where('title', '<=', validatedQuery.q + '\uf8ff');
    }

    // Apply sorting
    const sortField = validatedQuery.sortBy;
    const sortDirection = validatedQuery.sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortField, sortDirection);

    // Apply pagination
    const limit = validatedQuery.limit;
    const offset = (validatedQuery.page - 1) * limit;

    // Get total count for pagination
    const countQuery = query; // Clone query for counting
    const totalCountSnapshot = await countQuery.count().get();
    const totalCount = totalCountSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.limit(limit).offset(offset).get();

    const resources = await Promise.all(snapshot.docs.map(async (doc) => {
      const resource = doc.data();

      // Get owner details
      const ownerDoc = await db.collection('users').doc(resource.ownerId).get();
      const owner = ownerDoc.data()!;

      return {
        id: doc.id,
        title: resource.title,
        description: resource.description.substring(0, 200) + '...', // Truncate for list view
        course: resource.course,
        subject: resource.subject,
        itemType: resource.itemType,
        resourceType: resource.resourceType,
        availability: resource.availability,
        imageUrl: resource.imageUrl,
        tags: resource.tags,
        createdAt: resource.createdAt,
        viewCount: resource.viewCount,
        requestCount: resource.requestCount,
        owner: {
          id: owner.id,
          name: owner.name,
          avatarUrl: owner.avatarUrl,
          trustScore: owner.trustScore
        }
      };
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        resources,
        pagination: {
          page: validatedQuery.page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNext: validatedQuery.page < totalPages,
          hasPrev: validatedQuery.page > 1
        },
        filters: {
          applied: {
            course: validatedQuery.course,
            itemType: validatedQuery.itemType,
            resourceType: validatedQuery.resourceType,
            availability: validatedQuery.availability,
            tags: validatedQuery.tags,
            search: validatedQuery.q
          }
        }
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters');
    }

    throw error;
  }
}

async function handleGetResource(req: AuthenticatedRequest, res: Response, resourceId: string) {
  try {
    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new NotFoundError('Resource');
    }

    const resource = resourceDoc.data()!;

    // Increment view count
    await db.collection('resources').doc(resourceId).update({
      viewCount: resource.viewCount + 1,
      lastViewed: new Date()
    });

    // Get owner details
    const ownerDoc = await db.collection('users').doc(resource.ownerId).get();
    const owner = ownerDoc.data()!;

    // Get comments
    const commentsSnapshot = await db.collection('resources')
      .doc(resourceId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const comments = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
      const comment = commentDoc.data();

      // Get commenter details
      const commenterDoc = await db.collection('users').doc(comment.userId).get();
      const commenter = commenterDoc.data()!;

      return {
        id: commentDoc.id,
        text: comment.text,
        user: {
          id: commenter.id,
          name: commenter.name,
          avatarUrl: commenter.avatarUrl
        },
        createdAt: comment.createdAt
      };
    }));

    // Check if current user saved this resource
    let isSaved = false;
    let canBorrow = false;
    let requestStatus = null;

    if (req.user) {
      const userDoc = await db.collection('users').doc(req.user.id).get();
      const userData = userDoc.data()!;
      isSaved = userData.savedItems?.includes(resourceId) || false;

      // Check if user can borrow this resource
      canBorrow = resource.resourceType === 'Physical' &&
                 resource.availability === 'Available' &&
                 resource.ownerId !== req.user.id &&
                 req.user.isVerified;

      // Check user's current request status
      if (resource.requesterId === req.user.id) {
        requestStatus = resource.availability;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        resource: {
          id: resourceId,
          title: resource.title,
          description: resource.description,
          course: resource.course,
          subject: resource.subject,
          itemType: resource.itemType,
          resourceType: resource.resourceType,
          availability: resource.availability,
          imageUrl: resource.imageUrl,
          fileUrl: resource.fileUrl,
          fileMimeType: resource.fileMimeType,
          meetupLocation: resource.meetupLocation,
          deadline: resource.deadline,
          tags: resource.tags,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt,
          viewCount: resource.viewCount + 1,
          requestCount: resource.requestCount,
          owner: {
            id: owner.id,
            name: owner.name,
            username: owner.username,
            avatarUrl: owner.avatarUrl,
            trustScore: owner.trustScore,
            status: owner.status
          }
        },
        comments,
        isSaved,
        canBorrow,
        requestStatus
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw error;
  }
}

async function handleDeleteResource(req: AuthenticatedRequest, res: Response, resourceId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new NotFoundError('Resource');
    }

    const resource = resourceDoc.data()!;

    // Check ownership or admin
    if (resource.ownerId !== req.user.id && !req.user.isAdmin) {
      throw new AuthorizationError('Only resource owner or admin can delete this resource');
    }

    // Delete associated files from storage
    // This would involve more complex cleanup in a real implementation

    // Delete resource
    await db.collection('resources').doc(resourceId).delete();

    logger.info('Resource deleted', {
      resourceId,
      userId: req.user.id,
      title: resource.title
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Resource deleted successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error;
    }
    throw error;
  }
}

async function handleToggleSaveResource(req: AuthenticatedRequest, res: Response, resourceId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new NotFoundError('Resource');
    }

    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data()!;
    const savedItems = userData.savedItems || [];

    const isCurrentlySaved = savedItems.includes(resourceId);
    let updatedSavedItems;

    if (isCurrentlySaved) {
      // Unsave resource
      updatedSavedItems = savedItems.filter((id: string) => id !== resourceId);
    } else {
      // Save resource
      updatedSavedItems = [...savedItems, resourceId];
    }

    await db.collection('users').doc(req.user.id).update({
      savedItems: updatedSavedItems,
      updatedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      data: {
        saved: !isCurrentlySaved,
        message: isCurrentlySaved ? 'Resource removed from saved items' : 'Resource saved successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof AuthenticationError) {
      throw error;
    }
    throw error;
  }
}

async function handleBorrowResource(req: AuthenticatedRequest, res: Response, resourceId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!req.user.isVerified) {
      throw new AuthorizationError('Account verification required to borrow resources');
    }

    const validatedData = borrowRequestSchema.parse(req.body);

    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new NotFoundError('Resource');
    }

    const resource = resourceDoc.data()!;

    // Validate borrow request
    if (resource.ownerId === req.user.id) {
      throw new ValidationError('Cannot borrow your own resource');
    }

    if (resource.resourceType !== 'Physical') {
      throw new ValidationError('Only physical resources can be borrowed');
    }

    if (resource.availability !== 'Available') {
      throw new ConflictError('Resource is not available for borrowing');
    }

    if (req.user.trustScore < 30) {
      throw new AuthorizationError('Insufficient trust score to borrow resources');
    }

    // Check user's active borrow requests
    const activeRequestsQuery = await db.collection('resources')
      .where('requesterId', '==', req.user.id)
      .where('availability', 'in', ['Pending Approval', 'Borrowed'])
      .get();

    if (activeRequestsQuery.size >= 5) {
      throw new ValidationError('Too many active borrow requests (max 5)');
    }

    // Update resource with borrow request
    await db.collection('resources').doc(resourceId).update({
      availability: 'Pending Approval',
      requesterId: req.user.id,
      requestMessage: validatedData.message,
      proposedDeadline: validatedData.proposedDeadline ? new Date(validatedData.proposedDeadline) : null,
      requestedAt: new Date(),
      updatedAt: new Date()
    });

    // Create notification for resource owner
    await db.collection('notifications').add({
      userId: resource.ownerId,
      type: 'borrow_request',
      message: `Borrow request for "${resource.title}"`,
      resourceId: resourceId,
      actorId: req.user.id,
      read: false,
      data: {
        requestMessage: validatedData.message,
        proposedDeadline: validatedData.proposedDeadline
      },
      createdAt: new Date()
    });

    logger.info('Borrow request created', {
      resourceId,
      borrowerId: req.user.id,
      ownerId: resource.ownerId
    });

    return res.status(200).json({
      success: true,
      data: {
        requestId: resourceId,
        message: 'Borrow request sent to resource owner'
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid borrow request data');
    }

    if (error instanceof NotFoundError || error instanceof AuthenticationError ||
        error instanceof AuthorizationError || error instanceof ConflictError) {
      throw error;
    }

    throw error;
  }
}

async function handleAddComment(req: AuthenticatedRequest, res: Response, resourceId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!req.user.isVerified) {
      throw new AuthorizationError('Account verification required to comment');
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      throw new ValidationError('Comment text is required');
    }

    if (text.length < 1 || text.length > 1000) {
      throw new ValidationError('Comment must be between 1 and 1000 characters');
    }

    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new NotFoundError('Resource');
    }

    // Create comment
    const commentData = {
      userId: req.user.id,
      text: text.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const commentRef = await db.collection('resources')
      .doc(resourceId)
      .collection('comments')
      .add(commentData);

    // Get commenter details
    const commenterDoc = await db.collection('users').doc(req.user.id).get();
    const commenter = commenterDoc.data()!;

    // Create notification for resource owner (if not their own comment)
    const resource = resourceDoc.data()!;
    if (resource.ownerId !== req.user.id) {
      await db.collection('notifications').add({
        userId: resource.ownerId,
        type: 'comment',
        message: `New comment on "${resource.title}"`,
        resourceId: resourceId,
        actorId: req.user.id,
        read: false,
        createdAt: new Date()
      });
    }

    logger.info('Comment added', {
      commentId: commentRef.id,
      resourceId,
      userId: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: {
        comment: {
          id: commentRef.id,
          text: commentData.text,
          user: {
            id: commenter.id,
            name: commenter.name,
            avatarUrl: commenter.avatarUrl
          },
          createdAt: commentData.createdAt
        }
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof AuthenticationError ||
        error instanceof AuthorizationError || error instanceof ValidationError) {
      throw error;
    }
    throw error;
  }
}

async function handleGetResourceComments(req: AuthenticatedRequest, res: Response, resourceId: string) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new NotFoundError('Resource');
    }

    const commentsSnapshot = await db.collection('resources')
      .doc(resourceId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const comments = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
      const comment = commentDoc.data();

      const commenterDoc = await db.collection('users').doc(comment.userId).get();
      const commenter = commenterDoc.data()!;

      return {
        id: commentDoc.id,
        text: comment.text,
        user: {
          id: commenter.id,
          name: commenter.name,
          avatarUrl: commenter.avatarUrl
        },
        createdAt: comment.createdAt
      };
    }));

    // Get total count for pagination
    const totalCountSnapshot = await db.collection('resources')
      .doc(resourceId)
      .collection('comments')
      .count()
      .get();
    const totalCount = totalCountSnapshot.data().count;

    return res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw error;
  }
}