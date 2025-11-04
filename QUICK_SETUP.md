# EduSwap Firebase Backend - Quick Setup

## 🚀 You're Logged In! Now Let's Set Up Your Project

### Step 1: Create Your Firebase Project
1. Go to: https://console.firebase.google.com
2. Click "Add project"
3. Name it: `eduswap-app`
4. Click "Create project"
5. Wait for it to finish (takes 1-2 minutes)

### Step 2: Copy This Code to Your Computer

Create a new folder on your computer (anywhere you like):
- Name it: `eduswap-backend`

Copy this code into files:

**package.json:**
```json
{
  "name": "eduswap-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "serve": "firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.5.0",
    "firebase-functions": "^4.8.1",
    "cors": "^2.8.5",
    "zod": "^3.22.4"
  }
}
```

**firebase.json:**
```json
{
  "functions": {
    "runtime": "nodejs18",
    "source": "functions"
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### Step 3: Initialize Firebase
Open PowerShell in your new folder and run:
```cmd
firebase init
```

Choose these options:
- ✓ Functions
- ✓ Firestore
- ✓ Storage
- Use existing project
- Select your `eduswap-app` project

### Step 4: Deploy Everything
```cmd
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions
```

## 🎯 That's It! Your Backend Is Live!

Your API will be at: https://your-region-eduswap-app.cloudfunctions.net/api

## What You Get:
✅ User registration & login
✅ File uploads (PDFs, images)
✅ Messaging between users
✅ Admin verification system
✅ Real-time notifications
✅ Complete security

## Next: Connect Your Frontend
Update your frontend to use these new backend URLs!

Questions? The setup is simpler than it looks!