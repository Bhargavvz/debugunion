# Firebase Service Account Setup Guide

This guide will help you set up Firebase service account credentials for the DevBounty backend API.

## 🔥 Prerequisites

- Firebase project created (debugunion)
- Firebase Realtime Database enabled
- Admin access to the Firebase console

## 📋 Step-by-Step Setup

### 1. Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **debugunion**

### 2. Enable Required Services

#### Enable Realtime Database
1. Navigate to **Realtime Database** in the left sidebar
2. Click **Create Database**
3. Choose **Start in test mode** (we'll configure rules later)
4. Select your preferred location (us-central1 recommended)
5. Your database URL will be: `https://debugunion-default-rtdb.firebaseio.com/`

#### Enable Authentication
1. Navigate to **Authentication** in the left sidebar
2. Go to **Sign-in method** tab
3. Enable the following providers:
   - **Email/Password** ✅
   - **Google** (optional) ✅
   - **GitHub** (optional) ✅

### 3. Generate Service Account Key

1. Go to **Project Settings** (gear icon)
2. Navigate to **Service accounts** tab
3. Click **Generate new private key**
4. Click **Generate key** - this will download a JSON file
5. **IMPORTANT**: Keep this file secure and never commit it to version control

### 4. Extract Service Account Information

From the downloaded JSON file, extract these values:

```json
{
  "type": "service_account",
  "project_id": "debugunion",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@debugunion.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40debugunion.iam.gserviceaccount.com"
}
```

### 5. Create .env File

Create a `.env` file in the backend directory with the following content:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=debugunion
FIREBASE_PRIVATE_KEY_ID=YOUR_PRIVATE_KEY_ID_FROM_JSON
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_FROM_JSON\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@debugunion.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=YOUR_CLIENT_ID_FROM_JSON
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40debugunion.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://debugunion-default-rtdb.firebaseio.com/

# Firebase Web App Configuration (for frontend)
FIREBASE_API_KEY=AIzaSyCQn2VetH_uvCLOPiiSVwlb0d6ToIumFTc
FIREBASE_AUTH_DOMAIN=debugunion.firebaseapp.com
FIREBASE_STORAGE_BUCKET=debugunion.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=458197287671
FIREBASE_APP_ID=1:458197287671:web:9e9da763381b8468a009f2

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# JWT Configuration (GENERATED SECURE SECRET)
JWT_SECRET=K8mN9pQ2rS5tU6vW7xY8zA3bC4dE9fG2hI5jK8lM1nO4pQ7rS0tU3vW6xY9zA2bC5dE8fG1hI4jK7lM0nO3pQ6rS9tU2vW5xY8zA1bC4dE7fG0hI3jK6lM9nO2pQ5r
JWT_EXPIRES_IN=24h

# API Configuration
API_BASE_URL=/api/v1
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 6. Configure Database Rules

In Firebase Console → Realtime Database → Rules, set up these rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    },
    "issues": {
      ".read": true,
      "$issueId": {
        ".write": "auth != null && (data.child('authorId').val() === auth.uid || !data.exists() || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
      }
    },
    "comments": {
      ".read": true,
      "$commentId": {
        ".write": "auth != null && (data.child('authorId').val() === auth.uid || !data.exists() || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
      }
    },
    "fixes": {
      ".read": true,
      "$fixId": {
        ".write": "auth != null && (data.child('authorId').val() === auth.uid || !data.exists() || root.child('users').child(auth.uid).child('isAdmin').val() === true)"
      }
    },
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "badges": {
      ".read": true,
      ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true"
    }
  }
}
```

### 7. Initialize Database Structure

Import the initial database structure by uploading this JSON to your Realtime Database:

```json
{
  "badges": {
    "first-fix": {
      "name": "First Fix",
      "description": "Submitted your first fix",
      "icon": "Award",
      "color": "yellow",
      "rarity": "common"
    },
    "bug-slayer": {
      "name": "Bug Slayer",
      "description": "Fixed 10+ bugs",
      "icon": "Bug",
      "color": "emerald",
      "rarity": "common"
    },
    "bounty-hunter": {
      "name": "Bounty Hunter",
      "description": "Earned $500+ in bounties",
      "icon": "DollarSign",
      "color": "green",
      "rarity": "rare"
    },
    "helper": {
      "name": "Helper",
      "description": "Helped 50+ developers",
      "icon": "Heart",
      "color": "rose",
      "rarity": "epic"
    },
    "code-wizard": {
      "name": "Code Wizard",
      "description": "Earned 5000+ XP",
      "icon": "Zap",
      "color": "purple",
      "rarity": "legendary"
    }
  },
  "trending_tags": {
    "react": { "count": 0 },
    "nodejs": { "count": 0 },
    "javascript": { "count": 0 },
    "typescript": { "count": 0 },
    "python": { "count": 0 },
    "css": { "count": 0 },
    "html": { "count": 0 },
    "api": { "count": 0 }
  }
}
```

## 🚀 Testing the Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test the health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

4. **Check Firebase connection**:
   ```bash
   curl http://localhost:5000/api/v1
   ```

## 🔒 Security Best Practices

1. **Never commit service account keys** to version control
2. **Add `.env` to `.gitignore`** (already done)
3. **Use environment variables** in production
4. **Rotate keys periodically** for enhanced security
5. **Restrict database rules** for production use
6. **Enable Firebase Security Rules** monitoring

## 🐛 Troubleshooting

### Common Issues

**Connection Error**: 
- Verify database URL format
- Check service account permissions
- Ensure Realtime Database is enabled

**Authentication Error**:
- Verify private key format (includes \n characters)
- Check client email format
- Ensure service account has proper roles

**Permission Denied**:
- Review database rules
- Check user authentication status
- Verify admin permissions

## 📚 Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## ✅ Verification Checklist

- [ ] Firebase project created (debugunion)
- [ ] Realtime Database enabled
- [ ] Authentication providers configured
- [ ] Service account key generated
- [ ] .env file created with all credentials
- [ ] Database rules configured
- [ ] Initial data structure imported
- [ ] Backend server starts successfully
- [ ] Health endpoint responds
- [ ] Firebase connection verified

Once all steps are complete, your DevBounty backend API will be fully configured and ready to use!