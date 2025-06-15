# 🚀 DevBounty Backend - Quick Start Guide

Get your DevBounty backend API up and running in 5 minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase project created (debugunion)
- Git (optional)

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd project-bolt-sb1-bbqks1ud/backend
npm install
```

### 2. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **debugunion** project
3. Navigate to **Project Settings** → **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file (keep it secure!)

### 3. Create Environment File

Copy the template and fill in your credentials:
```bash
cp .env.template .env
```

Edit `.env` file with your service account details:
```env
# Replace these with values from your downloaded JSON file:
FIREBASE_PRIVATE_KEY_ID=your_actual_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_actual_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@debugunion.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_actual_client_id
```

### 4. Enable Firebase Services

In Firebase Console:

**Realtime Database:**
1. Go to **Realtime Database**
2. Click **Create Database**
3. Choose **Start in test mode**
4. Select region (us-central1)

**Authentication:**
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional)

### 5. Start the Server
```bash
npm run dev
```

🎉 **Your API is now running at:** `http://localhost:5000`

## 🧪 Test Your Setup

**Health Check:**
```bash
curl http://localhost:5000/health
```

**API Info:**
```bash
curl http://localhost:5000/api/v1
```

**Expected Response:**
```json
{
  "success": true,
  "message": "DevBounty API v1",
  "data": {
    "version": "1.0.0",
    "endpoints": [...]
  }
}
```

## 🔥 Firebase Database Rules

Set these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "issues": {
      ".read": true,
      "$issueId": {
        ".write": "auth != null"
      }
    },
    "comments": {
      ".read": true,
      "$commentId": {
        ".write": "auth != null"
      }
    },
    "fixes": {
      ".read": true,
      "$fixId": {
        ".write": "auth != null"
      }
    }
  }
}
```

## 📱 Frontend Integration

Use this config in your React app:

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCQn2VetH_uvCLOPiiSVwlb0d6ToIumFTc",
  authDomain: "debugunion.firebaseapp.com",
  projectId: "debugunion",
  storageBucket: "debugunion.firebasestorage.app",
  messagingSenderId: "458197287671",
  appId: "1:458197287671:web:9e9da763381b8468a009f2",
  databaseURL: "https://debugunion-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
```

## 🎯 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Issues
- `GET /api/v1/issues` - List issues
- `POST /api/v1/issues` - Create issue
- `GET /api/v1/issues/:id` - Get issue details

### Users
- `GET /api/v1/users/:id` - Get user profile
- `GET /api/v1/users/search` - Search users

## 🔧 Environment Variables

Your `.env` file should contain:

```env
# ✅ Already configured
FIREBASE_PROJECT_ID=debugunion
FIREBASE_API_KEY=AIzaSyCQn2VetH_uvCLOPiiSVwlb0d6ToIumFTc
FIREBASE_AUTH_DOMAIN=debugunion.firebaseapp.com
FIREBASE_DATABASE_URL=https://debugunion-default-rtdb.firebaseio.com/
JWT_SECRET=K8mN9pQ2rS5tU6vW7xY8zA3bC4dE9fG2hI5jK8lM1nO4pQ7rS0tU3vW6xY9zA2bC5dE8fG1hI4jK7lM0nO3pQ6rS9tU2vW5xY8zA1bC4dE7fG0hI3jK6lM9nO2pQ5r

# 🔄 Need to fill in
FIREBASE_PRIVATE_KEY_ID=get_from_service_account_json
FIREBASE_PRIVATE_KEY="get_from_service_account_json"
FIREBASE_CLIENT_EMAIL=get_from_service_account_json
FIREBASE_CLIENT_ID=get_from_service_account_json
```

## 🐛 Troubleshooting

**Server won't start?**
- Check if port 5000 is available
- Verify all required env variables are set
- Check Node.js version (requires 18+)

**Firebase connection error?**
- Verify service account key is valid
- Check if Realtime Database is enabled
- Ensure database URL is correct

**Authentication failing?**
- Enable Email/Password in Firebase Console
- Check if auth domain is correct
- Verify API key is valid

## 🎉 Success!

Your DevBounty backend is ready! Key features:

- ✅ User authentication with Firebase
- ✅ Issue management system
- ✅ Comment and fix submissions
- ✅ Bounty reward system
- ✅ Real-time database sync
- ✅ Rate limiting and security
- ✅ Comprehensive API documentation

## 📚 Next Steps

1. **Test API endpoints** with Postman/curl
2. **Connect your frontend** using the Firebase config
3. **Deploy to production** (see deployment guide)
4. **Set up monitoring** and logging
5. **Configure backup** strategies

**Need help?** Check the detailed setup guide in `FIREBASE_SETUP.md` or the full documentation in `README.md`.

---

**Happy coding! 🚀**