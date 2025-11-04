import { Request, Response } from 'express';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import {
  verificationActionSchema,
  createAnnouncementSchema,
  paginationSchema
} from '../types/validation';
import {
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest
} from '../middleware/auth';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError
} from '../utils/errors';
import { logger } from '../utils/logger';
import { createBulkNotifications } from './notifications';

const db = getFirestore(getApp());
const auth = getAuth(getApp());

export async function adminRoutes(req: Request, res: Response) {
  const path = req.path.replace('/api/admin', '') || '/';

  try {
    // Apply authentication and admin middleware
    await new Promise<void>((resolve, reject) => {
      authenticateToken(req as AuthenticatedRequest, res, (error) => {
        if (error) return reject(error);
        requireAdmin(req as AuthenticatedRequest, res, (error) => {
          if (error) return reject(error);
          resolve();
        });
      });
    });

    switch (req.method) {
      case 'GET':
        if (path === '/verifications') {
          return await handleGetVerifications(req as AuthenticatedRequest, res);
        } else if (path === '/reports') {
          return await handleGetReports(req as AuthenticatedRequest, res);
        } else if (path === '/stats') {
          return await handleGetStats(req as AuthenticatedRequest, res);
        } else if (path === '/users') {
          return await handleGetUsers(req as AuthenticatedRequest, res);
        }
        break;

      case 'POST':
        if (path.match(/^\/verifications\/[^\/]+$/)) {
          const userId = path.substring('/verifications/'.length);
          return await handleVerificationAction(req as AuthenticatedRequest, res, userId);
        } else if (path === '/announcements') {
          return await handleCreateAnnouncement(req as AuthenticatedRequest, res);
        }
        break;

      case 'DELETE':
        if (path.match(/^\/reports\/[^\/]+$/)) {
          const reportId = path.substring('/reports/'.length);
          return await handleDismissReport(req as AuthenticatedRequest, res, reportId);
        } else if (path.match(/^\/users\/[^\/]+$/)) {
          const userId = path.substring('/users/'.length);
          return await handleDeleteUser(req as AuthenticatedRequest, res, userId);
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
        message: 'Admin endpoint not found'
      }
    });
  } catch (error: any) {
    logger.error('Admin route error', { error: error.message, path, method: req.method });
    throw error;
  }
}

async function handleGetVerifications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedQuery = paginationSchema.parse(req.query);
    const status = req.query.status as string || 'pending';

    let query = db.collection('users')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc');

    // Apply pagination
    const limit = validatedQuery.limit;
    const offset = (validatedQuery.page - 1) * limit;

    // Get total count
    const countQuery = query;
    const totalCountSnapshot = await countQuery.count().get();
    const totalCount = totalCountSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.limit(limit).offset(offset).get();

    const verifications = snapshot.docs.map((doc) => {
      const user = doc.data();
      return {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          rollNumber: user.rollNumber,
          course: user.course,
          createdAt: user.createdAt
        },
        idCardUrl: user.idCardUrl,
        submittedAt: user.idCardSubmittedAt || user.createdAt,
        status: user.status
      };
    });

    // Get stats
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      db.collection('users').where('status', '==', 'pending').count().get(),
      db.collection('users').where('status', '==', 'verified').count().get(),
      db.collection('users').where('status', '==', 'rejected').count().get()
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        verifications,
        pagination: {
          page: validatedQuery.page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNext: validatedQuery.page < totalPages,
          hasPrev: validatedQuery.page > 1
        },
        stats: {
          pending: pendingCount.data().count,
          approved: approvedCount.data().count,
          rejected: rejectedCount.data().count
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

async function handleVerificationAction(req: AuthenticatedRequest, res: Response, userId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedData = verificationActionSchema.parse(req.body);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new NotFoundError('User');
    }

    const userData = userDoc.data()!;

    if (userData.status !== 'pending') {
      throw new ValidationError('User is not pending verification');
    }

    let updateData: any = {
      status: validatedData.action === 'approve' ? 'verified' : 'rejected',
      updatedAt: new Date(),
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    };

    let message = '';

    if (validatedData.action === 'approve') {
      // Set custom claims for verified user
      await auth.setCustomUserClaims(userId, {
        verified: true,
        trustScore: userData.trustScore,
        isAdmin: userData.isAdmin || false
      });

      message = 'User verification approved';
    } else {
      if (!validatedData.reason) {
        throw new ValidationError('Reason is required for rejection');
      }

      updateData.rejectionReason = validatedData.reason;
      updateData.canReapplyAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      message = 'User verification rejected';
    }

    await db.collection('users').doc(userId).update(updateData);

    // Create notification for user
    await db.collection('notifications').add({
      userId: userId,
      type: 'admin',
      message: `Your account verification has been ${validatedData.action}d`,
      read: false,
      data: {
        action: validatedData.action,
        reason: validatedData.reason
      },
      createdAt: new Date()
    });

    logger.info('User verification processed', {
      userId,
      action: validatedData.action,
      adminId: req.user.id,
      reason: validatedData.reason
    });

    return res.status(200).json({
      success: true,
      data: {
        message,
        userId: userId,
        action: validatedData.action
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid verification action data');
    }

    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    throw error;
  }
}

async function handleGetReports(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedQuery = paginationSchema.parse(req.query);
    const status = req.query.status as string || 'pending';

    let query = db.collection('reports')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc');

    // Apply pagination
    const limit = validatedQuery.limit;
    const offset = (validatedQuery.page - 1) * limit;

    // Get total count
    const countQuery = query;
    const totalCountSnapshot = await countQuery.count().get();
    const totalCount = totalCountSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.limit(limit).offset(offset).get();

    const reports = await Promise.all(snapshot.docs.map(async (doc) => {
      const report = doc.data();

      // Get resource details
      let resource = null;
      if (report.resourceId) {
        const resourceDoc = await db.collection('resources').doc(report.resourceId).get();
        if (resourceDoc.exists) {
          resource = resourceDoc.data();
        }
      }

      // Get reporter details
      let reporter = null;
      if (report.reporterId) {
        const reporterDoc = await db.collection('users').doc(report.reporterId).get();
        if (reporterDoc.exists) {
          reporter = reporterDoc.data();
        }
      }

      return {
        id: doc.id,
        resource,
        reporter,
        reasonCategory: report.reasonCategory,
        reasonDetails: report.reasonDetails,
        status: report.status,
        createdAt: report.createdAt,
        resolvedAt: report.resolvedAt,
        resolvedBy: report.resolvedBy
      };
    }));

    // Get stats
    const [pendingCount, resolvedCount, dismissedCount] = await Promise.all([
      db.collection('reports').where('status', '==', 'pending').count().get(),
      db.collection('reports').where('status', '==', 'resolved').count().get(),
      db.collection('reports').where('status', '==', 'dismissed').count().get()
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page: validatedQuery.page,
          limit: limit,
          total: totalCount,
          totalPages: totalPages,
          hasNext: validatedQuery.page < totalPages,
          hasPrev: validatedQuery.page > 1
        },
        stats: {
          pending: pendingCount.data().count,
          resolved: resolvedCount.data().count,
          dismissed: dismissedCount.data().count
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

async function handleCreateAnnouncement(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedData = createAnnouncementSchema.parse(req.body);

    // Get target users based on audience
    let targetUsersQuery = db.collection('users');

    if (validatedData.targetAudience === 'verified') {
      targetUsersQuery = targetUsersQuery.where('status', '==', 'verified');
    } else if (validatedData.targetAudience === 'pending') {
      targetUsersQuery = targetUsersQuery.where('status', '==', 'pending');
    }

    const targetUsersSnapshot = await targetUsersQuery.get();
    const targetUserIds = targetUsersSnapshot.docs.map(doc => doc.id);

    if (targetUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_TARGET_USERS',
          message: 'No users found for the specified audience'
        }
      });
    }

    // Create announcement record
    const announcementData = {
      title: validatedData.title,
      message: validatedData.message,
      priority: validatedData.priority,
      targetAudience: validatedData.targetAudience,
      targetCount: targetUserIds.length,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    const announcementRef = await db.collection('announcements').add(announcementData);

    // Create notifications for all target users
    await createBulkNotifications(
      targetUserIds,
      'announcement',
      validatedData.title,
      {
        data: {
          announcementId: announcementRef.id,
          message: validatedData.message,
          priority: validatedData.priority
        }
      }
    );

    logger.info('Announcement created and sent', {
      announcementId: announcementRef.id,
      title: validatedData.title,
      targetCount: targetUserIds.length,
      targetAudience: validatedData.targetAudience,
      adminId: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: {
        announcementId: announcementRef.id,
        sentCount: targetUserIds.length,
        message: 'Announcement sent successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid announcement data');
    }
    throw error;
  }
}

async function handleDismissReport(req: AuthenticatedRequest, res: Response, reportId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const reportDoc = await db.collection('reports').doc(reportId).get();
    if (!reportDoc.exists) {
      throw new NotFoundError('Report');
    }

    await db.collection('reports').doc(reportId).update({
      status: 'dismissed',
      resolvedAt: new Date(),
      resolvedBy: req.user.id
    });

    logger.info('Report dismissed', {
      reportId,
      adminId: req.user.id
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Report dismissed successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw error;
  }
}

async function handleGetStats(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Get various statistics
    const [
      totalUsers,
      verifiedUsers,
      pendingUsers,
      totalResources,
      availableResources,
      borrowedResources,
      totalReports,
      pendingReports,
      todaySignups,
      todayResources
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('users').where('status', '==', 'verified').count().get(),
      db.collection('users').where('status', '==', 'pending').count().get(),
      db.collection('resources').count().get(),
      db.collection('resources').where('availability', '==', 'Available').count().get(),
      db.collection('resources').where('availability', '==', 'Borrowed').count().get(),
      db.collection('reports').count().get(),
      db.collection('reports').where('status', '==', 'pending').count().get(),
      // Today's stats
      getTodayCount('users'),
      getTodayCount('resources')
    ]);

    const stats = {
      users: {
        total: totalUsers.data().count,
        verified: verifiedUsers.data().count,
        pending: pendingUsers.data().count,
        todaySignups: todaySignups
      },
      resources: {
        total: totalResources.data().count,
        available: availableResources.data().count,
        borrowed: borrowedResources.data().count,
        todayUploads: todayResources
      },
      reports: {
        total: totalReports.data().count,
        pending: pendingReports.data().count
      }
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    throw error;
  }
}

async function handleGetUsers(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedQuery = paginationSchema.parse(req.query);
    const status = req.query.status as string;
    const search = req.query.search as string;

    let query = db.collection('users')
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (search) {
      // Basic search by name or username
      // In a real implementation, you might use a more sophisticated search
      query = query.where('name', '>=', search)
                   .where('name', '<=', search + '\uf8ff');
    }

    // Apply pagination
    const limit = validatedQuery.limit;
    const offset = (validatedQuery.page - 1) * limit;

    // Get total count
    const countQuery = query;
    const totalCountSnapshot = await countQuery.count().get();
    const totalCount = totalCountSnapshot.data().count;

    // Get paginated results
    const snapshot = await query.limit(limit).offset(offset).get();

    const users = snapshot.docs.map((doc) => {
      const user = doc.data();
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        rollNumber: user.rollNumber,
        course: user.course,
        status: user.status,
        trustScore: user.trustScore,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: {
        users,
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
    throw error;
  }
}

async function handleDeleteUser(req: AuthenticatedRequest, res: Response, userId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (userId === req.user.id) {
      throw new ValidationError('Cannot delete your own account through admin panel');
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new NotFoundError('User');
    }

    const userData = userDoc.data()!;

    // Delete user's resources
    const resourcesSnapshot = await db.collection('resources')
      .where('ownerId', '==', userId)
      .get();

    const batch = db.batch();

    // Delete resources
    resourcesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .get();

    notificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user document
    batch.delete(db.collection('users').doc(userId));

    // Delete user from Firebase Auth
    await auth.deleteUser(userId);

    await batch.commit();

    logger.info('User deleted by admin', {
      userId,
      adminId: req.user.id,
      username: userData.username
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'User deleted successfully'
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    // Handle Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new NotFoundError('User');
    }

    throw error;
  }
}

async function getTodayCount(collection: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshot = await db.collection(collection)
    .where('createdAt', '>=', today)
    .count()
    .get();

  return snapshot.data().count;
}