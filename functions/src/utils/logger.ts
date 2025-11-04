import { https } from 'firebase-functions/v2';

// Simple logger for Firebase Functions
export const logger = {
  info: (message: string, data?: any) => {
    https.logger.log(`INFO: ${message}`, data || {});
  },

  error: (message: string, data?: any) => {
    https.logger.log(`ERROR: ${message}`, data || {});
  },

  warn: (message: string, data?: any) => {
    https.logger.log(`WARN: ${message}`, data || {});
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      https.logger.log(`DEBUG: ${message}`, data || {});
    }
  }
};