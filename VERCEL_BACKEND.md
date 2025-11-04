# 🚀 QUICK VERCEL DEPLOYMENT - 100% FREE!

## Create These Files in Your eduswap-backend folder:

### 1. package.json
```json
{
  "name": "eduswap-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vercel dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

### 2. api/index.js
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: '🚀 EduSwap Backend Working!',
    timestamp: new Date()
  });
});

// Main API
app.get('/api', (req, res) => {
  res.json({
    message: 'EduSwap API is Live!',
    endpoints: [
      'GET /api/health',
      'POST /api/users/register',
      'POST /api/users/login'
    ]
  });
});

// Test endpoints
app.post('/api/users/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registration endpoint working!',
    data: req.body
  });
});

app.post('/api/users/login', (req, res) => {
  res.json({
    success: true,
    message: 'User login endpoint working!',
    token: 'mock-token-' + Date.now()
  });
});

export default app;
```

### 3. vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ]
}
```

## 🚀 DEPLOY IN 2 MINUTES:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in your folder
3. Choose NO to link to existing project
4. Deploy done!

## 🎯 Your Backend URLs:
- Main API: https://your-app.vercel.app/api
- Health: https://your-app.vercel.app/api/health

## 💡 100% FREE Features:
- ✅ Unlimited API calls
- ✅ SSL certificates
- ✅ Global CDN
- ✅ Custom domains
- ✅ No credit card needed

## 🎉 Ready to Deploy?
1. Create the files above
2. Run: npm install
3. Run: vercel deploy

## 🚀 ALTERNATIVE: Netlify
If Vercel doesn't work, use Netlify (also 100% free!)

## 🔥 Let's Get This Working NOW!
Choose Vercel and we'll have your EduSwap backend live in minutes!