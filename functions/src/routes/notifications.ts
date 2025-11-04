import { Request, Response } from 'express';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { notificationQuerySchema } from '../types/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError
} from '../utils/errors';
import { logger } from '../utils/logger';

const db = getFirestore(getApp());

export async function notificationRoutes(req: Request, res: Response) {
  const path = req.path.replace('/api/notifications', '') || '/';

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
        if (path === '/') {
          return await handleGetNotifications(req as AuthenticatedRequest, res);
        }
        break;

      case 'POST':
        if (path === '/read-all') {
          return await handleMarkAllRead(req as AuthenticatedRequest, res);
        } else if (path.match(/^\/[^\/]+\/read$/)) {
          const notificationId = path.substring(1, path.indexOf('/read'));
          return await handleMarkNotificationRead(req as AuthenticatedRequest, res, notificationId);
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
        message: 'Notification endpoint not found'
      }
    });
  } catch (error: any) {
    logger.error('Notification route error', { error: error.message, path, method: req.method });
    throw error;
  }
}

async function handleGetNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedQuery = notificationQuerySchema.parse(req.query);

    let query = db.collection('notifications')
      .where('userId', '==', req.user.id);

    // Apply filters
    if (validatedQuery.type) {
      query = query.where('type', '==', validatedQuery.type);
    }

    if (validatedQuery.read !== undefined) {
      query = query.where('read', '==', validatedQuery.read);
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');

    // Apply pagination
    const limit = validatedQuery.limit;
    const offset = (validatedQuery.page - 1) * limit;

    // Get total count for pagination
    const countQuery = query; // Clone query for counting
    const totalCountSnapshot = await countQuery.count().get();
    const totalCount = totalCountSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.limit(limit).offset(offset).get();

    const notifications = await Promise.all(snapshot.docs.map(async (doc) => {
      const notification = doc.data();
      let actor = null;
      let resource = null;

      // Get actor details if present
      if (notification.actorId) {
        const actorDoc = await db.collection('users').doc(notification.actorId).get();
        if (actorDoc.exists) {
          const actorData = actorDoc.data()!;
          actor = {
            id: actorData.id,
            name: actorData.name,
            username: actorData.username,
            avatarUrl: actorData.avatarUrl
          };
        }
      }

      // Get resource details if present
      if (notification.resourceId) {
        const resourceDoc = await db.collection('resources').doc(notification.resourceId).get();
        if (resourceDoc.exists) {
          const resourceData = resourceDoc.data()!;
          resource = {
            id: resourceData.id,
            title: resourceData.title,
            imageUrl: resourceData.imageUrl
          };
        }
      }

      return {
        id: doc.id,
        type: notification.type,
        message: notification.message,
        read: notification.read,
        actor,
        resource,
        data: notification.data,
        createdAt: notification.createdAt
      };
    }));

    // Get unread count
    const unreadQuery = db.collection('notifications')
      .where('userId', '==', req.user.id)
      .where('read', '==', false);
    const unreadSnapshot = await unreadQuery.count().get();
    const unreadCount = unreadSnapshot.data().count;

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: validatedQuery.page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNext: validatedQuery.page < totalPages,
          hasPrev: validatedQuery.page > 1
        }
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters');
    }

    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw error;
  }
}

async function handleMarkNotificationRead(req: AuthenticatedRequest, res: Response, notificationId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    if (!notificationDoc.exists) {
      throw new NotFoundError('Notification');
    }

    const notification = notificationDoc.data()!;

    // Verify ownership
    if (notification.userId !== req.user.id) {
      throw new AuthenticationError('Access denied');
    }

    // Mark as read
    await db.collection('notifications').doc(notificationId).update({
      read: true,
      readAt: new Date()
    });

    logger.info('Notification marked as read', {
      notificationId,
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Notification marked as read'
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof AuthenticationError) {
      throw error;
    }
    throw error;
  }
}

async function handleMarkAllRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Get all unread notifications for user
    const unreadNotifications = await db.collection('notifications')
      .where('userId', '==', req.user.id)
      .where('read', '==', false)
      .get();

    if (unreadNotifications.empty) {
      return res.status(200).json({
        success: true,
        data: {
          markedCount: 0,
          message: 'No unread notifications to mark'
        }
      });
    }

    // Batch update all unread notifications
    const batch = db.batch();
    unreadNotifications.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date()
      });
    });

    await batch.commit();

    logger.info('All notifications marked as read', {
      userId: req.user.id,
      markedCount: unreadNotifications.size
    });

    return res.status(200).json({
      success: true,
      data: {
        markedCount: unreadNotifications.size,
        message: `Marked ${unreadNotifications.size} notifications as read`
      }
    });

  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw error;
  }
}

// Helper function to create notifications (used by other services)
export async function createNotification(
  userId: string,
  type: string,
  message: string,
  options: {
    resourceId?: string;
    actorId?: string;
    data?: any;
  } = {}
): Promise<string> {
  try {
    const notificationData = {
      userId,
      type,
      message,
      read: false,
      createdAt: new Date(),
      ...(options.resourceId && { resourceId: options.resourceId }),
      ...(options.actorId && { actorId: options.actorId }),
      ...(options.data && { data: options.data })
    };

    const notificationRef = await db.collection('notifications').add(notificationData);

    logger.info('Notification created', {
      notificationId: notificationRef.id,
      userId,
      type,
      message
    });

    return notificationRef.id;
  } catch (error: any) {
    logger.error('Failed to create notification', {
      error: error.message,
      userId,
      type,
      message
    });
    throw error;
  }
}

// Helper function to create bulk notifications (for announcements)
export async function createBulkNotifications(
  userIds: string[],
  type: string,
  message: string,
  options: {
    data?: any;
  } = {}
): Promise<string[]> {
  try {
    const batch = db.batch();
    const notificationIds: string[] = [];

    userIds.forEach((userId) => {
      const notificationRef = db.collection('notifications').doc();
      const notificationData = {
        userId,
        type,
        message,
        read: false,
        createdAt: new Date(),
        ...(options.data && { data: options.data })
      };

      batch.set(notificationRef, notificationData);
      notificationIds.push(notificationRef.id);
    });

    await batch.commit();

    logger.info('Bulk notifications created', {
      count: userIds.length,
      type,
      message
    });

    return notificationIds;
  } catch (error: any) {
    logger.error('Failed to create bulk notifications', {
      error: error.message,
      count: userIds.length,
      type,
      message
    });
    throw error;
  }
}