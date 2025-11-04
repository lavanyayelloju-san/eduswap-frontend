import { Request, Response, NextFunction } from 'express';
import { getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

const auth = getAuth(getApp());
const db = getFirestore(getApp());

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    username: string;
    status: string;
    trustScore: number;
    isAdmin: boolean;
    isVerified: boolean;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new AuthenticationError('User not found');
    }

    const userData = userDoc.data()!;

    // Attach user to request
    req.user = {
      id: uid,
      email: userData.email,
      name: userData.name,
      username: userData.username,
      status: userData.status || 'pending',
      trustScore: userData.trustScore || 50,
      isAdmin: userData.isAdmin || false,
      isVerified: userData.status === 'verified'
    };

    logger.debug('User authenticated', { userId: uid, username: userData.username });
    next();
  } catch (error: any) {
    if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-expired') {
      return next(new AuthenticationError('Invalid or expired token'));
    }
    next(error);
  }
}

export function requireVerified(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (!req.user.isVerified) {
    return next(new AuthorizationError('Account verification required'));
  }

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (!req.user.isAdmin) {
    return next(new AuthorizationError('Admin access required'));
  }

  next();
}

export function requireOwnership(resourceIdParam: string = 'resourceId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return next(new Error('Resource ID required'));
      }

      // Get resource to check ownership
      const resourceDoc = await req.db!.collection('resources').doc(resourceId).get();
      if (!resourceDoc.exists) {
        return next(new Error('Resource not found'));
      }

      const resource = resourceDoc.data()!;

      // Check if user owns the resource or is admin
      if (resource.ownerId !== req.user.id && !req.user.isAdmin) {
        return next(new AuthorizationError('Resource access denied'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireParticipant(conversationIdParam: string = 'conversationId') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError('Authentication required'));
      }

      const conversationId = req.params[conversationIdParam];
      if (!conversationId) {
        return next(new Error('Conversation ID required'));
      }

      // Get conversation to check participation
      const conversationDoc = await req.db!.collection('conversations').doc(conversationId).get();
      if (!conversationDoc.exists) {
        return next(new Error('Conversation not found'));
      }

      const conversation = conversationDoc.data()!;

      // Check if user is a participant
      if (!conversation.participantIds.includes(req.user.id)) {
        return next(new AuthorizationError('Conversation access denied'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}