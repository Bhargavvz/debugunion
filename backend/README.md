# DevBounty Backend API

A comprehensive backend API for DevBounty - a developer community platform for posting and solving coding issues with bounty rewards.

## 🚀 Features

- **Authentication & Authorization**: Firebase Authentication integration with JWT tokens
- **User Management**: User profiles, following system, XP/level system
- **Issue Management**: Create, update, delete, vote, and follow coding issues
- **Fix Submissions**: Submit, vote, and accept fixes for issues
- **Comment System**: Nested comments with voting support
- **Bounty System**: Reward system for accepted fixes
- **Real-time Database**: Firebase Realtime Database integration
- **Rate Limiting**: Protection against spam and abuse
- **Input Validation**: Comprehensive request validation with Joi
- **Error Handling**: Centralized error management
- **Security**: Helmet, CORS, and other security middleware

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Admin SDK
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Utilities**: Moment.js, UUID, Bcrypt

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Firebase project with Realtime Database enabled
- Firebase service account credentials

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-bolt-sb1-bbqks1ud/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=24h
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

## 🔥 Firebase Setup

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database

2. **Generate service account credentials**
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Download the JSON file
   - Extract the credentials to your `.env` file

3. **Database Rules**
   Set up your Realtime Database rules:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null",
       "users": {
         "$uid": {
           ".write": "$uid === auth.uid"
         }
       }
     }
   }
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
The API uses Firebase ID tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Endpoints Overview

#### Authentication (`/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current user
- `PATCH /profile` - Update user profile
- `PATCH /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `POST /verify-email` - Verify email address

#### Users (`/users`)
- `GET /search` - Search users
- `GET /:userId` - Get user profile
- `GET /:userId/stats` - Get user statistics
- `GET /:userId/issues` - Get user's issues
- `GET /:userId/fixes` - Get user's fixes
- `GET /:userId/followers` - Get user's followers
- `GET /:userId/following` - Get user's following
- `POST /:userId/follow` - Follow/unfollow user

#### Issues (`/issues`)
- `GET /` - Get all issues (with filtering)
- `POST /` - Create new issue
- `GET /trending` - Get trending issues
- `GET /stats` - Get issue statistics
- `GET /:issueId` - Get issue by ID
- `PATCH /:issueId` - Update issue
- `DELETE /:issueId` - Delete issue
- `POST /:issueId/vote` - Vote on issue
- `POST /:issueId/follow` - Follow/unfollow issue

#### Comments (`/comments`)
- `GET /stats` - Get comment statistics
- `GET /:commentId` - Get comment by ID
- `GET /user/:userId` - Get user's comments
- `GET /issue/:issueId` - Get comments for issue
- `POST /issue/:issueId` - Create comment
- `PATCH /:commentId` - Update comment
- `DELETE /:commentId` - Delete comment
- `POST /:commentId/vote` - Vote on comment

#### Fixes (`/fixes`)
- `GET /stats` - Get fix statistics
- `GET /:fixId` - Get fix by ID
- `GET /user/:userId` - Get user's fixes
- `GET /issue/:issueId` - Get fixes for issue
- `POST /issue/:issueId` - Submit fix
- `PATCH /:fixId` - Update fix
- `DELETE /:fixId` - Delete fix
- `POST /:fixId/accept` - Accept fix (issue author only)
- `POST /:fixId/vote` - Vote on fix

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## 🔐 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: All requests are validated using Joi schemas
- **Authentication**: Firebase Authentication integration
- **Authorization**: Role-based access control
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Helmet**: Security headers for Express.js
- **Error Handling**: Secure error responses without sensitive data leaks

## 📊 Database Structure

The Firebase Realtime Database is structured as follows:

```
{
  "users": {
    "userId": {
      "id": "string",
      "username": "string",
      "email": "string",
      "avatar": "string",
      "bio": "string",
      "xp": "number",
      "level": "number",
      "issuesPosted": "number",
      "issuesFixed": "number",
      "bountyEarned": "number",
      "badges": ["string"],
      "skills": ["string"],
      "preferences": {},
      "createdAt": "timestamp"
    }
  },
  "issues": {
    "issueId": {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "stack": ["string"],
      "tags": ["string"],
      "authorId": "string",
      "status": "string",
      "priority": "string",
      "bounty": "number",
      "views": "number",
      "upvotes": "number",
      "downvotes": "number",
      "followers": ["string"],
      "createdAt": "timestamp"
    }
  },
  "comments": {
    "commentId": {
      "id": "string",
      "issueId": "string",
      "authorId": "string",
      "content": "string",
      "parentId": "string",
      "votes": "number",
      "createdAt": "timestamp"
    }
  },
  "fixes": {
    "fixId": {
      "id": "string",
      "issueId": "string",
      "authorId": "string",
      "description": "string",
      "codeSnippet": "string",
      "githubPr": "string",
      "isAccepted": "boolean",
      "votes": "number",
      "bountyAwarded": "number",
      "createdAt": "timestamp"
    }
  }
}
```

## 🧪 Testing

Run the development server and test endpoints using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

Example test request:
```bash
curl -X GET http://localhost:5000/api/v1/issues \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json"
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production Firebase credentials
3. Set secure JWT secret
4. Configure CORS origins for production domains

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Performance & Scalability

- **Rate Limiting**: Configurable limits prevent abuse
- **Compression**: Gzip compression for responses
- **Caching**: Firebase Realtime Database built-in caching
- **Error Handling**: Graceful error handling prevents crashes
- **Memory Management**: Efficient memory usage patterns

## 🔧 Configuration

Key configuration options in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🐛 Error Codes

Common error codes returned by the API:

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Happy coding! 🚀**