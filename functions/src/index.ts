import { https } from 'firebase-functions/v2';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { resourceRoutes } from './routes/resources';
import { notificationRoutes } from './routes/notifications';
import { messageRoutes } from './routes/messages';
import { adminRoutes } from './routes/admin';
import { logger } from './utils/logger';

// Initialize Firebase Admin
const app = getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// CORS configuration
const corsHandler = cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://eduswap.app', 'https://www.eduswap.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
});

// Health check endpoint
export const healthCheck = https.onRequest(async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'connected',
        auth: 'connected',
        storage: 'connected'
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Test database connectivity
    await db.collection('health').doc('check').get();

    return res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    return res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service unavailable'
      }
    });
  }
});

// API Routes
export const api = https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Add request context
      req.db = db;
      req.storage = storage;
      req.logger = logger;

      // Route handling
      const path = req.path;
      const method = req.method;

      logger.info(`${method} ${path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      // Authentication routes
      if (path.startsWith('/api/auth')) {
        return authRoutes(req, res);
      }

      // User routes
      if (path.startsWith('/api/users')) {
        return userRoutes(req, res);
      }

      // Resource routes
      if (path.startsWith('/api/resources')) {
        return resourceRoutes(req, res);
      }

      // Notification routes
      if (path.startsWith('/api/notifications')) {
        return notificationRoutes(req, res);
      }

      // Message routes
      if (path.startsWith('/api/dms')) {
        return messageRoutes(req, res);
      }

      // Admin routes
      if (path.startsWith('/api/admin')) {
        return adminRoutes(req, res);
      }

      // 404 for unknown routes
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found'
        }
      });

    } catch (error) {
      return errorHandler(error, req, res);
    }
  });
});

// Firestore triggers for real-time features
export const onResourceCommentCreated = https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { resourceId, commentId, userId, text } = data;

  try {
    // Get resource details
    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new https.HttpsError('not-found', 'Resource not found');
    }

    const resource = resourceDoc.data();

    // Create notification for resource owner (if not their own comment)
    if (resource.ownerId !== userId) {
      await db.collection('notifications').add({
        userId: resource.ownerId,
        type: 'comment',
        message: `New comment on "${resource.title}"`,
        resourceId: resourceId,
        actorId: userId,
        read: false,
        createdAt: new Date()
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Error creating comment notification', { error: error.message, data });
    throw new https.HttpsError('internal', 'Failed to create notification');
  }
});

export const onBorrowRequestCreated = https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { resourceId, requesterId, message } = data;

  try {
    // Get resource details
    const resourceDoc = await db.collection('resources').doc(resourceId).get();
    if (!resourceDoc.exists) {
      throw new https.HttpsError('not-found', 'Resource not found');
    }

    const resource = resourceDoc.data();

    // Create notification for resource owner
    await db.collection('notifications').add({
      userId: resource.ownerId,
      type: 'borrow_request',
      message: `Borrow request for "${resource.title}"`,
      resourceId: resourceId,
      actorId: requesterId,
      read: false,
      data: { requestMessage: message },
      createdAt: new Date()
    });

    return { success: true };
  } catch (error) {
    logger.error('Error creating borrow request notification', { error: error.message, data });
    throw new https.HttpsError('internal', 'Failed to create notification');
  }
});

export const onMessageCreated = https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { conversationId, senderId, recipientId, text } = data;

  try {
    // Create notification for recipient
    await db.collection('notifications').add({
      userId: recipientId,
      type: 'message',
      message: 'New message received',
      actorId: senderId,
      read: false,
      data: { conversationId, messageText: text },
      createdAt: new Date()
    });

    // Update conversation metadata
    await db.collection('conversations').doc(conversationId).update({
      lastMessage: text,
      lastMessageTimestamp: new Date(),
      lastMessageSenderId: senderId
    });

    return { success: true };
  } catch (error) {
    logger.error('Error creating message notification', { error: error.message, data });
    throw new https.HttpsError('internal', 'Failed to create notification');
  }
});