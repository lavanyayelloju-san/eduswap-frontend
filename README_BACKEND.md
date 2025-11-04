# EduSwap Firebase Backend

A comprehensive Firebase backend implementation for the EduSwap platform - a trust-based resource exchange system for college students.

## Overview

This backend provides:
- **Firebase Authentication** with multi-step verification (email → OTP → ID card → admin approval)
- **Cloud Firestore** database with comprehensive security rules
- **Firebase Storage** for file uploads with security rules
- **Firebase Functions** for serverless API endpoints
- **Real-time features** using Firestore listeners
- **Admin panel** for user verification and content moderation

## Architecture

### Tech Stack
- **Firebase Functions**: Node.js 18 runtime with TypeScript
- **Firebase Auth**: User authentication and verification
- **Cloud Firestore**: NoSQL database for all data models
- **Firebase Storage**: File storage for images, documents, and ID cards
- **Zod**: Schema validation
- **Sharp**: Image processing
- **Winston**: Logging

### Data Models

#### Users Collection
```javascript
{
  id: string,                    // Firebase Auth UID
  name: string,                  // Full name
  username: string,              // Unique username
  email: string,                 // Email (from Firebase Auth)
  rollNumber: string,            // College roll number
  avatarUrl: string,             // Profile picture URL
  status: 'pending'|'verified'|'rejected',
  idCardUrl: string,             // College ID card URL
  trustScore: number,            // Trust score (default: 50)
  savedItems: array[string],     // Saved resource IDs
  bio?: string,                  // Optional biography
  course?: string,               // Course/branch
  createdAt: timestamp,
  updatedAt: timestamp,
  isAdmin: boolean,
  lastActive: timestamp
}
```

#### Resources Collection
```javascript
{
  id: string,
  ownerId: string,               // User ID of owner
  title: string,
  description: string,
  course: string,
  subject: string,
  itemType: 'Notes'|'Textbook'|'Lab Equipment'|'Past Papers'|'Other',
  resourceType: 'Digital'|'Physical',
  availability: 'Available'|'Borrowed'|'Pending Approval',
  imageUrl?: string,
  fileUrl?: string,
  fileMimeType?: string,
  meetupLocation?: string,
  deadline?: timestamp,
  tags: array[string],
  requesterId?: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  viewCount: number,
  requestCount: number
}
```

## API Endpoints

### Authentication (/api/auth)
- `POST /register` - Create new user account
- `POST /login` - Authenticate user
- `POST /generate-otp` - Generate OTP for verification
- `POST /verify-otp` - Verify OTP code

### Users (/api/users)
- `GET /me` - Get current user profile
- `PUT /me` - Update current user profile
- `POST /upload-avatar` - Upload profile picture
- `GET /:userId` - Get public user profile

### Resources (/api/resources)
- `POST /` - Create new resource
- `GET /` - Get paginated resources with filtering
- `GET /:resourceId` - Get single resource with comments
- `DELETE /:resourceId` - Delete resource (owner/admin only)
- `POST /:resourceId/save` - Save/unsave resource
- `POST /:resourceId/borrow` - Request to borrow resource
- `POST /:resourceId/comments` - Add comment to resource
- `GET /:resourceId/comments` - Get resource comments

### Notifications (/api/notifications)
- `GET /` - Get user notifications
- `POST /:notificationId/read` - Mark notification as read
- `POST /read-all` - Mark all notifications as read

### Direct Messaging (/api/dms)
- `GET /conversations` - Get user conversations
- `GET /conversations/:conversationId` - Get conversation messages
- `POST /messages` - Send message

### Admin (/api/admin)
- `GET /verifications` - Get pending user verifications
- `POST /verifications/:userId` - Approve/reject verification
- `GET /reports` - Get reported content
- `POST /announcements` - Send global announcement
- `GET /stats` - Get platform statistics

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud account with Firebase project

### 1. Firebase Project Setup
```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init functions

# Configure project settings
firebase use your-project-id
firebase functions:config:set env.mode="development"
```

### 2. Install Dependencies
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# or install from root
npm run install:backend
```

### 3. Environment Configuration
Set Firebase Functions config:
```bash
# Development
firebase functions:config:set env.mode="development"

# Production (when ready)
firebase functions:config:set \
  env.mode="production" \
  email.service="sendgrid" \
  sendgrid.api_key="YOUR_SENDGRID_API_KEY" \
  sendgrid.from_email="noreply@eduswap.app" \
  sendgrid.from_name="EduSwap"
```

### 4. Deploy Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 5. Deploy Functions
```bash
# Build and deploy functions
npm run build
firebase deploy --only functions
```

### 6. Test Locally
```bash
# Start emulators
firebase emulators:start

# Run functions shell
npm run shell
```

## Security Features

### Authentication Security
- Multi-step verification process (email → OTP → ID card → admin approval)
- Password strength requirements
- Rate limiting on authentication endpoints
- Account lockout after failed attempts

### Data Security
- Firestore security rules for data access control
- Firebase Storage security rules for file access
- Input validation with Zod schemas
- XSS prevention with DOMPurify
- SQL injection prevention (Firestore protection)

### File Upload Security
- File type validation
- File size limits
- Image processing with Sharp
- Virus scanning capability
- Private storage for sensitive files

## Real-time Features

### Notifications
- Real-time notification triggers
- FCM integration for push notifications
- Notification types: comments, borrow requests, announcements

### Messaging
- Real-time chat between users
- Online status indicators
- Typing indicators
- Message read receipts

### Resource Activity
- Live resource availability updates
- Real-time borrow request handling
- Trust score updates

## Performance Optimization

### Database Indexes
- Composite indexes for complex queries
- Single field indexes for filtering
- Array contains indexes for tag searches

### Caching Strategy
- Firebase CDN integration
- Client-side caching with Firestore persistence
- Image optimization and caching

### Rate Limiting
- Redis-based rate limiting (optional)
- Built-in Firebase rate limiting
- Custom rate limiting per endpoint

## Monitoring and Logging

### Health Checks
- `/healthCheck` endpoint for monitoring
- Database connectivity checks
- Service status monitoring

### Logging
- Structured logging with Winston
- Error tracking and reporting
- Request logging for debugging

### Monitoring
- Firebase Functions monitoring
- Custom metrics dashboard
- Performance analytics

## Deployment

### Development
```bash
# Deploy to development project
firebase use eduswap-dev
firebase deploy --only functions
```

### Production
```bash
# Deploy to production project
firebase use eduswap-prod
firebase deploy --only functions,firestore:rules,storage
```

### CI/CD
The project includes GitHub Actions workflow for automated deployment:
- Tests run on pull requests
- Automatic deployment on main branch merge
- Environment-specific deployments

## Testing

### Unit Tests
```bash
cd functions
npm test
```

### Integration Tests
```bash
# Start emulators
firebase emulators:start

# Run integration tests
npm run test:integration
```

### Manual Testing
Use Firebase Functions shell:
```bash
npm run shell
```

## Troubleshooting

### Common Issues

1. **Functions not deploying**
   - Check Node.js version (must be 18+)
   - Verify Firebase project configuration
   - Check build errors in logs

2. **Security rules blocking access**
   - Verify user authentication status
   - Check Firestore rules for proper permissions
   - Test with Firebase emulator

3. **File upload failures**
   - Check file size limits
   - Verify file type restrictions
   - Check Storage security rules

4. **Real-time updates not working**
   - Verify Firestore rules
   - Check client-side listener setup
   - Test with emulator

### Debug Mode
Enable debug logging:
```bash
firebase functions:config:set debug.enabled="true"
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check Firebase documentation
- Review error logs in Firebase Console