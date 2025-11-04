// FIX: Created types.ts to define shared data structures for the application.
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  rollNumber: string;
  avatarUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  idCardUrl?: string;
  trustScore: number;
  savedItems: string[];
  bio?: string;
  course?: string;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  text: string;
  timestamp: string;
}

export interface Resource {
  id: string;
  owner: User;
  title: string;
  description: string;
  course: string;
  subject: string;
  itemType: 'Notes' | 'Textbook' | 'Lab Equipment' | 'Past Papers' | 'Other';
  resourceType: 'Digital' | 'Physical';
  availability: 'Available' | 'Borrowed' | 'Pending Approval';
  imageUrl?: string;
  fileUrl?: string;
  fileMimeType?: string;
  meetupLocation?: string;
  deadline?: string;
  tags: string[];
  comments: Comment[];
  requesterId?: string;
}

export interface Notification {
  id: string;
  type: 'comment' | 'borrow_request' | 'borrow_response' | 'announcement' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
  resourceId?: string;
  borrower?: User;
  processed?: boolean;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
}

export interface Conversation {
    id: string;
    participant: User;
    lastMessage: string;
    messages: Message[];
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface Report {
  id: string;
  resource: Resource;
  reporter: User;
  reasonCategory: string;
  reasonDetails: string;
  timestamp: string;
}

export type View = 'feed' | 'upload' | 'notifications' | 'profile' | 'admin' | 'login' | 'signup' | 'otp' | 'id_verification' | 'pending_verification' | 'dms' | 'chat' | 'announcements' | 'user_profile' | 'saved_items';