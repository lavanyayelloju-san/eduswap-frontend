import { Request, Response } from 'express';
import { z } from 'zod';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
} from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      db?: any;
      storage?: any;
      logger?: any;
      user?: any;
    }
  }
}

export function errorHandler(error: any, req: Request, res: Response) {
  logger.error('Application Error', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    userId: req.user?.id,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      },
      timestamp: new Date().toISOString()
    });
  }

  // Handle known error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      timestamp: new Date().toISOString()
    });
  }

  // Handle Firebase Auth errors
  if (error.code?.startsWith('auth/')) {
    const authErrorMap: { [key: string]: { code: string; message: string } } = {
      'auth/user-not-found': { code: 'USER_NOT_FOUND', message: 'User not found' },
      'auth/email-already-exists': { code: 'EMAIL_ALREADY_EXISTS', message: 'Email already registered' },
      'auth/weak-password': { code: 'WEAK_PASSWORD', message: 'Password is too weak' },
      'auth/invalid-email': { code: 'INVALID_EMAIL', message: 'Invalid email address' },
      'auth/too-many-requests': { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again later' },
      'auth/invalid-credential': { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      'auth/user-disabled': { code: 'ACCOUNT_DISABLED', message: 'Account has been disabled' },
      'auth/email-not-verified': { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address' }
    };

    const mappedError = authErrorMap[error.code];
    if (mappedError) {
      return res.status(400).json({
        success: false,
        error: mappedError,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle Firestore errors
  if (error.code?.startsWith('firestore/') || error.code?.startsWith('permission-denied')) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      timestamp: new Date().toISOString()
    });
  }

  // Handle Storage errors
  if (error.code?.startsWith('storage/')) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'STORAGE_ERROR',
        message: 'File storage operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    timestamp: new Date().toISOString()
  });
}