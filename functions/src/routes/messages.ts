import { Request, Response } from 'express';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { sendMessageSchema } from '../types/validation';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireParticipant
} from '../middleware/auth';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError
} from '../utils/errors';
import { logger } from '../utils/logger';
import { createNotification } from './notifications';

const db = getFirestore(getApp());

export async function messageRoutes(req: Request, res: Response) {
  const path = req.path.replace('/api/dms', '') || '/';

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
        if (path === '/conversations') {
          return await handleGetConversations(req as AuthenticatedRequest, res);
        } else if (path.match(/^\/conversations\/[^\/]+$/)) {
          const conversationId = path.substring('/conversations/'.length);
          // Apply participant middleware
          await new Promise<void>((resolve, reject) => {
            requireParticipant()(req as AuthenticatedRequest, res, (error) => {
              if (error) return reject(error);
              resolve();
            });
          });
          return await handleGetConversation(req as AuthenticatedRequest, res, conversationId);
        }
        break;

      case 'POST':
        if (path === '/messages') {
          return await handleSendMessage(req as AuthenticatedRequest, res);
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
        message: 'Message endpoint not found'
      }
    });
  } catch (error: any) {
    logger.error('Message route error', { error: error.message, path, method: req.method });
    throw error;
  }
}

async function handleGetConversations(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Get conversations where user is a participant
    const conversationsSnapshot = await db.collection('conversations')
      .where('participantIds', 'array-contains', req.user.id)
      .orderBy('lastMessageTimestamp', 'desc')
      .get();

    const conversations = await Promise.all(conversationsSnapshot.docs.map(async (doc) => {
      const conversation = doc.data();

      // Get the other participant's details
      const otherParticipantId = conversation.participantIds.find((id: string) => id !== req.user!.id);
      let participant = null;

      if (otherParticipantId) {
        const participantDoc = await db.collection('users').doc(otherParticipantId).get();
        if (participantDoc.exists) {
          const participantData = participantDoc.data()!;
          participant = {
            id: participantData.id,
            name: participantData.name,
            username: participantData.username,
            avatarUrl: participantData.avatarUrl,
            status: participantData.status,
            lastActive: participantData.lastActive
          };
        }
      }

      // Get unread message count
      const unreadQuery = await db.collection('conversations')
        .doc(doc.id)
        .collection('messages')
        .where('senderId', '!=', req.user!.id)
        .where('read', '==', false)
        .count()
        .get();
      const unreadCount = unreadQuery.data().count;

      return {
        id: doc.id,
        participant,
        lastMessage: conversation.lastMessage,
        lastMessageTimestamp: conversation.lastMessageTimestamp,
        lastMessageSenderId: conversation.lastMessageSenderId,
        unreadCount,
        isOnline: false // TODO: Implement presence system
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        conversations
      }
    });

  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw error;
  }
}

async function handleGetConversation(req: AuthenticatedRequest, res: Response, conversationId: string) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const conversationDoc = await db.collection('conversations').doc(conversationId).get();
    if (!conversationDoc.exists) {
      throw new NotFoundError('Conversation');
    }

    const conversation = conversationDoc.data()!;

    // Get the other participant's details
    const otherParticipantId = conversation.participantIds.find((id: string) => id !== req.user.id);
    let participant = null;

    if (otherParticipantId) {
      const participantDoc = await db.collection('users').doc(otherParticipantId).get();
      if (participantDoc.exists) {
        const participantData = participantDoc.data()!;
        participant = {
          id: participantData.id,
          name: participantData.name,
          username: participantData.username,
          avatarUrl: participantData.avatarUrl,
          status: participantData.status,
          lastActive: participantData.lastActive
        };
      }
    }

    // Get messages
    const messagesSnapshot = await db.collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const messages = messagesSnapshot.docs.map((doc) => {
      const message = doc.data();
      return {
        id: doc.id,
        senderId: message.senderId,
        text: message.text,
        messageType: message.messageType || 'text',
        read: message.read || false,
        createdAt: message.createdAt
      };
    }).reverse(); // Show newest at bottom

    // Get total count for pagination
    const totalCountSnapshot = await db.collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .count()
      .get();
    const totalCount = totalCountSnapshot.data().count;

    // Mark messages as read
    const unreadMessages = messagesSnapshot.docs.filter(
      doc => doc.data().senderId !== req.user.id && !doc.data().read
    );

    if (unreadMessages.length > 0) {
      const batch = db.batch();
      unreadMessages.forEach((doc) => {
        batch.update(doc.ref, { read: true, readAt: new Date() });
      });
      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          id: conversationId,
          participant,
          messages,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNext: page < Math.ceil(totalCount / limit),
            hasPrev: page > 1
          }
        }
      }
    });

  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof AuthenticationError) {
      throw error;
    }
    throw error;
  }
}

async function handleSendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const validatedData = sendMessageSchema.parse(req.body);

    if (validatedData.recipientId === req.user.id) {
      throw new ValidationError('Cannot send message to yourself');
    }

    // Check if recipient exists
    const recipientDoc = await db.collection('users').doc(validatedData.recipientId).get();
    if (!recipientDoc.exists) {
      throw new NotFoundError('Recipient');
    }

    // Find or create conversation
    const conversationsQuery = await db.collection('conversations')
      .where('participantIds', 'array-contains', req.user.id)
      .get();

    let conversationDoc = conversationsQuery.docs.find(doc => {
      const participants = doc.data().participantIds;
      return participants.includes(validatedData.recipientId);
    });

    let conversationId: string;

    if (conversationDoc) {
      conversationId = conversationDoc.id;
    } else {
      // Create new conversation
      const newConversationData = {
        participantIds: [req.user.id, validatedData.recipientId],
        lastMessage: validatedData.text,
        lastMessageTimestamp: new Date(),
        lastMessageSenderId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newConversationRef = await db.collection('conversations').add(newConversationData);
      conversationId = newConversationRef.id;

      logger.info('New conversation created', {
        conversationId,
        participants: [req.user.id, validatedData.recipientId]
      });
    }

    // Create message
    const messageData = {
      senderId: req.user.id,
      text: validatedData.text,
      messageType: validatedData.messageType,
      read: false,
      createdAt: new Date()
    };

    const messageRef = await db.collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .add(messageData);

    // Update conversation metadata
    await db.collection('conversations').doc(conversationId).update({
      lastMessage: validatedData.text,
      lastMessageTimestamp: new Date(),
      lastMessageSenderId: req.user.id,
      updatedAt: new Date()
    });

    // Create notification for recipient
    await createNotification(
      validatedData.recipientId,
      'message',
      'New message received',
      {
        actorId: req.user.id,
        data: {
          conversationId,
          messageText: validatedData.text
        }
      }
    );

    logger.info('Message sent', {
      messageId: messageRef.id,
      conversationId,
      senderId: req.user.id,
      recipientId: validatedData.recipientId
    });

    return res.status(201).json({
      success: true,
      data: {
        message: {
          id: messageRef.id,
          text: messageData.text,
          senderId: messageData.senderId,
          messageType: messageData.messageType,
          read: messageData.read,
          createdAt: messageData.createdAt
        },
        conversationId: conversationId
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid message data');
    }

    if (error instanceof NotFoundError || error instanceof AuthenticationError ||
        error instanceof ValidationError) {
      throw error;
    }

    throw error;
  }
}

// Helper function to check if users can message each other
export async function canMessageUsers(senderId: string, recipientId: string): Promise<boolean> {
  try {
    // Users can always message each other for now
    // In the future, you might implement blocking, privacy settings, etc.

    // Check if both users exist
    const [senderDoc, recipientDoc] = await Promise.all([
      db.collection('users').doc(senderId).get(),
      db.collection('users').doc(recipientId).get()
    ]);

    return senderDoc.exists && recipientDoc.exists;
  } catch (error) {
    return false;
  }
}

// Helper function to get conversation between two users
export async function getConversationBetweenUsers(
  userId1: string,
  userId2: string
): Promise<string | null> {
  try {
    const conversationsQuery = await db.collection('conversations')
      .where('participantIds', 'array-contains', userId1)
      .get();

    const conversation = conversationsQuery.docs.find(doc => {
      const participants = doc.data().participantIds;
      return participants.includes(userId2);
    });

    return conversation ? conversation.id : null;
  } catch (error) {
    return null;
  }
}