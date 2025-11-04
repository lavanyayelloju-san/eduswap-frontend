// FIX: Created mock data to populate the application.
import { User, Resource, Comment, Notification, Conversation, Report } from './types';

// Avatars
// Replaced the previous avatar set with a friendlier, more modern collection from Dicebear.
export const boyAvatars = [
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Max',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Oscar',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Sam',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Toby',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Charlie',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=George',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=William',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix'
];

export const girlAvatars = [
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Annie&earringsProbability=100',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Bella&hair=long01',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Chloe&glassesProbability=100',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Daisy&hair=long10',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Ellie&hair=long19',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Freya&hair=long06',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Grace&hair=long14',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Holly&earringsProbability=100&hair=long02',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Isla&hair=long22',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=Jasmine&hair=long26'
];

export const petAvatars = Array.from({ length: 10 }, (_, i) => `https://api.dicebear.com/8.x/micah/svg?seed=pet${i+1}`);


// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alex Johnson',
    username: 'alexj',
    email: 'alex.j@college.edu',
    rollNumber: '23259-AI-070',
    avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix',
    status: 'verified',
    idCardUrl: 'https://via.placeholder.com/400x250.png?text=Alex+ID',
    trustScore: 85,
    savedItems: ['resource-2'],
    bio: 'AI enthusiast and coffee lover. Here to share and learn!',
    course: 'B.Tech in Artificial Intelligence',
  },
  {
    id: 'user-2',
    name: 'Maria Garcia',
    username: 'mariag',
    email: 'maria.g@college.edu',
    rollNumber: '23259-CS-121',
    avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Bella&hair=long01',
    status: 'verified',
    idCardUrl: 'https://via.placeholder.com/400x250.png?text=Maria+ID',
    trustScore: 92,
    savedItems: [],
    bio: 'Future software developer. Focused on data structures and algorithms.',
    course: 'B.Tech in Computer Science',
  },
  {
    id: 'user-3',
    name: 'Sam Lee',
    username: 'samlee',
    email: 'sam.l@college.edu',
    rollNumber: '23259-EE-034',
    avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Sam',
    status: 'pending',
    idCardUrl: 'https://via.placeholder.com/400x250.png?text=Sam+ID',
    trustScore: 50,
    savedItems: ['resource-1'],
    bio: 'Electronics nerd. Always building something new.',
    course: 'B.Tech in Electrical Engineering',
  },
  {
    id: 'admin-user',
    name: 'EduSwap Admin',
    username: 'admin272007',
    email: 'eduswapsmsk@gmail.com',
    rollNumber: 'ADMIN-001',
    avatarUrl: 'https://api.dicebear.com/8.x/bottts/svg?seed=admin',
    status: 'verified',
    idCardUrl: '',
    trustScore: 100,
    savedItems: [],
    bio: 'Keeping the platform safe and resourceful for everyone.',
    course: 'Platform Administration',
  },
];

// Mock Comments
const mockComments: Comment[] = [
    { id: 'comment-1', user: {id: 'user-2', name: 'Maria Garcia', avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Bella&hair=long01'}, text: 'This is super helpful, thanks!', timestamp: '2 hours ago' },
    { id: 'comment-2', user: {id: 'user-1', name: 'Alex Johnson', avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix'}, text: 'Glad you liked it!', timestamp: '1 hour ago' },
];

// Mock Resources
export const mockResources: Resource[] = [
  {
    id: 'resource-1',
    owner: mockUsers[0],
    title: 'Advanced AI Concepts Notes',
    description: 'Complete notes from the Advanced AI course, covering all topics from the semester. Well-organized and includes diagrams.',
    course: 'CSE',
    subject: 'Artificial Intelligence',
    itemType: 'Notes',
    resourceType: 'Digital',
    availability: 'Available',
    fileUrl: '/mock-assets/sample.pdf',
    fileMimeType: 'application/pdf',
    tags: ['CSE', 'AI', 'Notes'],
    comments: mockComments,
  },
  {
    id: 'resource-2',
    owner: mockUsers[1],
    title: 'Data Structures Textbook (Used)',
    description: 'The official textbook for the Data Structures course. In good condition with minimal highlighting. 3rd Edition.',
    course: 'CSE',
    subject: 'Data Structures',
    itemType: 'Textbook',
    resourceType: 'Physical',
    availability: 'Pending Approval',
    requesterId: 'user-3',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
    meetupLocation: 'Library Entrance',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['CSE', 'DSA', 'Textbook'],
    comments: [],
  },
   {
    id: 'resource-3',
    owner: mockUsers[1],
    title: 'Digital Logic Design Lab Kit',
    description: 'Full kit with breadboard, wires, ICs, and multimeter. All components are tested and working.',
    course: 'EEE',
    subject: 'Digital Logic Design',
    itemType: 'Lab Equipment',
    resourceType: 'Physical',
    availability: 'Borrowed',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
    meetupLocation: 'Block A, EEE Lab',
    tags: ['EEE', 'DLD', 'Lab'],
    comments: [],
  },
   {
    id: 'resource-4',
    owner: mockUsers[0],
    title: 'Calculus Workbook',
    description: 'Practice problems for Calculus I. Barely used, no writing inside.',
    course: 'General',
    subject: 'Mathematics',
    itemType: 'Textbook',
    resourceType: 'Physical',
    availability: 'Pending Approval',
    requesterId: 'user-2',
    imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500&q=80',
    meetupLocation: 'Block C',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['Math', 'Calc', 'Workbook'],
    comments: [],
  },
];


// Mock Notifications
export const mockNotifications: Notification[] = [
    { id: 'notif-1', type: 'announcement', message: 'Welcome to the new Eduswap platform! We are excited to have you.', timestamp: '1 day ago', read: false },
    { id: 'notif-2', type: 'comment', message: 'Maria Garcia commented on your resource: "Advanced AI Concepts Notes"', timestamp: '2 hours ago', read: false, resourceId: 'resource-1' },
    { id: 'notif-3', type: 'borrow_request', message: 'Sam Lee wants to borrow "Data Structures Textbook"', timestamp: '30 minutes ago', read: false, resourceId: 'resource-2', borrower: mockUsers[2], processed: false },
    { id: 'notif-4', type: 'borrow_response', message: 'Your request for "Digital Logic Design Lab Kit" was approved.', timestamp: '3 hours ago', read: true, resourceId: 'resource-3' },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
    {
        id: 'convo-1',
        participant: mockUsers[1],
        lastMessage: 'Sure, I can meet you tomorrow at 2 PM.',
        messages: [
            { id: 'msg-1', senderId: 'user-1', text: 'Hey, is the textbook still available?', timestamp: '3:45 PM' },
            { id: 'msg-2', senderId: 'user-2', text: 'Yes it is!', timestamp: '3:46 PM' },
            { id: 'msg-3', senderId: 'user-1', text: 'Great! Can I pick it up tomorrow?', timestamp: '3:47 PM' },
            { id: 'msg-4', senderId: 'user-2', text: 'Sure, I can meet you tomorrow at 2 PM.', timestamp: '3:48 PM' },
        ]
    },
    {
        id: 'convo-2',
        participant: mockUsers[2],
        lastMessage: 'No problem, good luck with your exam!',
        messages: [
            { id: 'msg-5', senderId: 'user-1', text: 'Thanks for the notes!', timestamp: '1:10 PM' },
            { id: 'msg-6', senderId: 'user-3', text: 'No problem, good luck with your exam!', timestamp: '1:11 PM' },
        ]
    }
];

// Mock Reports
export const mockReports: Report[] = [
  {
    id: 'report-1',
    resource: mockResources[2],
    reporter: mockUsers[0],
    reasonCategory: 'Item Not as Described',
    reasonDetails: 'The item listed is broken and not as described in the post.',
    timestamp: '4 hours ago',
  },
];