import { z } from 'zod';

// User Registration Validation
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .transform(val => val.toLowerCase().trim()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .trim(),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform(val => val.toLowerCase().trim()),

  rollNumber: z.string()
    .min(5, 'Roll number too short')
    .max(20, 'Roll number too long')
    .regex(/^[A-Za-z0-9-]+$/, 'Roll number can only contain letters, numbers, and hyphens')
    .trim(),

  course: z.string()
    .max(100, 'Course name too long')
    .optional(),

  bio: z.string()
    .max(500, 'Bio too long')
    .optional()
});

// Login Validation
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .or(z.string().min(3, 'Username too short')) // Allow username login
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Password required')
});

// OTP Generation Validation
export const generateOtpSchema = z.object({
  purpose: z.enum(['email_verification', 'password_reset']),
  userId: z.string().optional()
});

// OTP Verification Validation
export const verifyOtpSchema = z.object({
  otpId: z.string().min(1, 'OTP ID required'),
  code: z.string()
    .length(6, 'OTP code must be 6 digits')
    .regex(/^\d{6}$/, 'OTP code must be numeric')
});

// User Profile Update Validation
export const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .trim()
    .optional(),

  bio: z.string()
    .max(500, 'Bio too long')
    .trim()
    .optional(),

  course: z.string()
    .max(100, 'Course name too long')
    .trim()
    .optional()
});

// Resource Creation Validation
export const createResourceSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title too long')
    .trim(),

  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description too long')
    .trim(),

  course: z.string()
    .min(2, 'Course must be at least 2 characters')
    .max(50, 'Course too long')
    .trim(),

  subject: z.string()
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject too long')
    .trim(),

  itemType: z.enum(['Notes', 'Textbook', 'Lab Equipment', 'Past Papers', 'Other']),
  resourceType: z.enum(['Digital', 'Physical']),

  meetupLocation: z.string()
    .min(5, 'Meetup location must be at least 5 characters')
    .max(200, 'Meetup location too long')
    .trim()
    .optional()
    .refine((location, ctx) => {
      if (ctx.parent.resourceType === 'Physical' && !location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Meetup location is required for physical items'
        });
      }
      return true;
    }),

  deadline: z.string()
    .datetime('Invalid deadline format')
    .optional()
    .refine((deadline, ctx) => {
      if (ctx.parent.resourceType === 'Physical' && !deadline) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Deadline is required for physical items'
        });
      }
      if (deadline) {
        const deadlineDate = new Date(deadline);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 1); // Minimum 1 day from now
        if (deadlineDate < minDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Deadline must be at least 1 day from now'
          });
        }
      }
      return true;
    }),

  tags: z.array(z.string().max(50, 'Tag too long').trim())
    .max(10, 'Too many tags (max 10)')
    .optional()
});

// Comment Creation Validation
export const createCommentSchema = z.object({
  text: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long')
    .trim()
    .refine((text) => {
      // Basic spam prevention
      const spamPatterns = [
        /^(\w+\s+){20,}\w+$/, // Too many short words
        /(.)\1{10,}/, // Repeated characters
        /\b(spam|scam|click|link|offer|free|win)\b/i // Common spam words
      ];
      return !spamPatterns.some(pattern => pattern.test(text));
    }, 'Comment appears to be spam')
});

// Message Sending Validation
export const sendMessageSchema = z.object({
  recipientId: z.string()
    .min(1, 'Recipient ID required')
    .uuid('Invalid recipient ID'),

  text: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .trim(),

  messageType: z.enum(['text', 'image', 'file']).default('text')
});

// Borrow Request Validation
export const borrowRequestSchema = z.object({
  message: z.string()
    .max(500, 'Message too long')
    .trim()
    .optional(),

  proposedDeadline: z.string()
    .datetime('Invalid deadline format')
    .optional()
    .refine((deadline) => {
      if (deadline) {
        const deadlineDate = new Date(deadline);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 1); // Minimum 1 day from now
        if (deadlineDate < minDate) {
          return false;
        }
      }
      return true;
    }, 'Deadline must be at least 1 day from now')
});

// Resource Query Validation
export const resourceQuerySchema = z.object({
  page: z.string()
    .transform(Number)
    .refine(n => n >= 1, 'Page must be at least 1')
    .default('1'),

  limit: z.string()
    .transform(Number)
    .refine(n => n >= 1 && n <= 50, 'Limit must be between 1 and 50')
    .default('20'),

  q: z.string()
    .max(100, 'Search query too long')
    .trim()
    .optional(),

  course: z.string()
    .max(50, 'Course filter too long')
    .trim()
    .optional(),

  itemType: z.enum(['Notes', 'Textbook', 'Lab Equipment', 'Past Papers', 'Other'])
    .optional(),

  resourceType: z.enum(['Digital', 'Physical'])
    .optional(),

  availability: z.enum(['Available', 'Borrowed', 'Pending Approval'])
    .optional(),

  ownerId: z.string()
    .min(1, 'Owner ID required')
    .optional(),

  tags: z.string()
    .transform(val => val ? val.split(',').map(tag => tag.trim()).filter(Boolean) : [])
    .optional(),

  sortBy: z.enum(['createdAt', 'title', 'trustScore'])
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc'])
    .default('desc')
});

// Admin Verification Action Validation
export const verificationActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string()
    .max(500, 'Reason too long')
    .trim()
    .optional()
    .refine((reason, ctx) => {
      if (ctx.parent.action === 'reject' && !reason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reason is required for rejection'
        });
      }
      return true;
    })
});

// Announcement Creation Validation
export const createAnnouncementSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title too long')
    .trim(),

  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message too long')
    .trim(),

  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  targetAudience: z.enum(['all', 'verified', 'pending']).default('all')
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.string()
    .transform(Number)
    .refine(n => n >= 1, 'Page must be at least 1')
    .default('1'),

  limit: z.string()
    .transform(Number)
    .refine(n => n >= 1 && n <= 50, 'Limit must be between 1 and 50')
    .default('20')
});

// Notification Query Schema
export const notificationQuerySchema = paginationSchema.extend({
  type: z.enum(['comment', 'borrow_request', 'borrow_response', 'announcement', 'admin', 'message'])
    .optional(),
  read: z.string()
    .transform(val => val === 'true')
    .optional()
});