# 🚀 Complete EduSwap API Endpoints

## Add this to your api/index.js file (replace existing content):

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data storage (in real app, use database)
const users = [];
const resources = [];
const messages = [];

// Health Check
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 EduSwap Backend Working!',
    endpoints: '/api/health, /api/users/register, /api/users/login, /api/resources'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date()
  });
});

// Authentication Endpoints
app.post('/api/users/register', (req, res) => {
  const { name, email, password, username, rollNumber } = req.body;

  if (!name || !email || !password || !username || !rollNumber) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required'
    });
  }

  // Check if user already exists
  if (users.find(u => u.email === email || u.username === username)) {
    return res.status(400).json({
      success: false,
      error: 'User already exists'
    });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    username,
    rollNumber,
    status: 'pending',
    trustScore: 50,
    createdAt: new Date()
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: {
      user: newUser,
      message: 'Registration successful! Please check your email.'
    }
  });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        status: user.status,
        trustScore: user.trustScore
      },
      token: 'mock-token-' + user.id,
      message: 'Login successful!'
    }
  });
});

// User Profile Endpoints
app.get('/api/users/me', (req, res) => {
  // In real app, get user ID from JWT token
  res.json({
    success: true,
    data: {
      id: '1',
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      status: 'verified',
      trustScore: 50,
      savedItems: []
    }
  });
});

// Resources Endpoints
app.post('/api/resources', (req, res) => {
  const { title, description, course, subject, itemType, resourceType } = req.body;

  if (!title || !description || !course || !subject || !itemType || !resourceType) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required'
    });
  }

  const newResource = {
    id: Date.now().toString(),
    title,
    description,
    course,
    subject,
    itemType,
    resourceType,
    availability: 'Available',
    ownerId: '1', // Mock owner ID
    createdAt: new Date()
  };

  resources.push(newResource);

  res.status(201).json({
    success: true,
    data: {
      resource: newResource,
      message: 'Resource created successfully!'
    }
  });
});

app.get('/api/resources', (req, res) => {
  res.json({
    success: true,
    data: {
      resources: resources,
      pagination: {
        page: 1,
        limit: 20,
        total: resources.length
      }
    }
  });
});

app.get('/api/resources/:id', (req, res) => {
  const { id } = req.params;
  const resource = resources.find(r => r.id === id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }

  res.json({
    success: true,
    data: {
      resource,
      owner: {
        id: '1',
        name: 'John Doe',
        avatarUrl: null,
        trustScore: 50
      }
    }
  });
});

// Messages Endpoints
app.get('/api/dms/conversations', (req, res) => {
  res.json({
    success: true,
    data: {
      conversations: [
        {
          id: '1',
          participant: {
            id: '2',
            name: 'Jane Smith',
            avatarUrl: null,
            lastActive: new Date()
          },
          lastMessage: 'Hi, interested in your notes',
          lastMessageTimestamp: new Date(),
          unreadCount: 1
        }
      ]
    }
  });
});

app.post('/api/dms/messages', (req, res) => {
  const { recipientId, text } = req.body;

  if (!recipientId || !text) {
    return res.status(400).json({
      success: false,
      error: 'Recipient and message are required'
    });
  }

  const newMessage = {
    id: Date.now().toString(),
    text,
    senderId: '1',
    recipientId,
    createdAt: new Date()
  };

  messages.push(newMessage);

  res.status(201).json({
    success: true,
    data: {
      message: newMessage,
      conversationId: '1'
    }
  });
});

// Notifications Endpoints
app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: [
        {
          id: '1',
          type: 'comment',
          message: 'New comment on your resource',
          read: false,
          createdAt: new Date()
        }
      ],
      unreadCount: 1
    }
  });
});

export default app;
```

## 🚀 Replace your api/index.js with this complete code!