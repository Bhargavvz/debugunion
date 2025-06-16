# DebugUnion - Developer Community Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9+-orange.svg)](https://firebase.google.com/)

A modern developer community platform where developers can post coding issues, offer solutions, and earn bounties. Built with React, Node.js, Express, and Firebase.

## 🚀 Features

- **Issue Management**: Post, browse, and solve coding issues
- **Bounty System**: Reward developers for providing solutions
- **Authentication**: Secure Firebase authentication with email and social login
- **Real-time Dashboard**: Track your contributions and progress
- **Trending Issues**: Discover popular and active discussions
- **Tagging System**: Organize issues by technology and category
- **User Profiles**: Build your developer reputation
- **Comments & Fixes**: Collaborative problem-solving
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        A[Landing Page] --> B[Authentication]
        B --> C[Dashboard]
        C --> D[Issue Management]
        D --> E[Profile System]
        
        F[Components]
        G[Contexts]
        H[API Service]
        I[UI Components]
        
        F --> G
        G --> H
        H --> I
    end
    
    subgraph "Backend (Node.js + Express)"
        J[Express Server] --> K[Routes]
        K --> L[Controllers]
        L --> M[Middleware]
        M --> N[Firebase Admin]
        
        O[Auth Middleware]
        P[Error Handling]
        Q[Rate Limiting]
        R[Validation]
        
        M --> O
        M --> P
        M --> Q
        M --> R
    end
    
    subgraph "Database (Firebase)"
        S[Users Collection]
        T[Issues Collection]
        U[Comments Collection]
        V[Fixes Collection]
        W[Real-time Database]
        
        S --> W
        T --> W
        U --> W
        V --> W
    end
    
    H --> J
    N --> W
    
    style A fill:#e1f5fe
    style J fill:#f3e5f5
    style W fill:#fff3e0
```

## 🔄 Application Flow

```mermaid
flowchart TD
    A[User visits DebugUnion] --> B{Authenticated?}
    
    B -->|No| C[Landing Page]
    B -->|Yes| D[Dashboard]
    
    C --> E[Sign Up / Sign In]
    E --> F[Firebase Authentication]
    F -->|Success| D
    F -->|Error| G[Show Error Message]
    G --> E
    
    D --> H[View Recent Issues]
    D --> I[View Statistics]
    D --> J[Navigation Menu]
    
    J --> K[Home Feed]
    J --> L[Discover Issues]
    J --> M[Post New Issue]
    J --> N[Messages]
    J --> O[Leaderboard]
    J --> P[Profile]
    
    K --> Q[Browse All Issues]
    L --> R[Filter & Search]
    M --> S[Create Issue Form]
    
    Q --> T[Select Issue]
    R --> T
    T --> U[Issue Detail Page]
    
    U --> V[Read Problem]
    U --> W[View Comments]
    U --> X[View Fixes]
    U --> Y[Add Comment]
    U --> Z[Submit Fix]
    
    S --> AA[Fill Issue Details]
    AA --> BB[Add Tags]
    BB --> CC[Set Bounty]
    CC --> DD[Submit Issue]
    DD --> EE[Issue Created]
    
    Y --> FF[Write Comment]
    FF --> GG[Post Comment]
    
    Z --> HH[Write Solution]
    HH --> II[Submit Code Fix]
    II --> JJ[Fix Submitted]
    
    style D fill:#4caf50,color:#fff
    style F fill:#ff9800,color:#fff
    style EE fill:#2196f3,color:#fff
    style JJ fill:#9c27b0,color:#fff
```

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS {
        string id PK
        string username
        string email
        string avatar
        number xp
        number level
        number bountyEarned
        array badges
        timestamp createdAt
        timestamp updatedAt
    }
    
    ISSUES {
        string id PK
        string title
        string description
        string category
        string priority
        string status
        number bounty
        array tags
        string authorId FK
        number views
        number upvotes
        array comments
        timestamp createdAt
        timestamp updatedAt
    }
    
    COMMENTS {
        string id PK
        string issueId FK
        string authorId FK
        string content
        number votes
        timestamp createdAt
        timestamp updatedAt
    }
    
    FIXES {
        string id PK
        string issueId FK
        string authorId FK
        string title
        string description
        string code
        boolean isAccepted
        number votes
        timestamp createdAt
        timestamp updatedAt
    }
    
    USERS ||--o{ ISSUES : "posts"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ FIXES : "submits"
    ISSUES ||--o{ COMMENTS : "has"
    ISSUES ||--o{ FIXES : "receives"
```

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant FB as Firebase Auth
    participant B as Backend
    participant DB as Database
    
    U->>F: Visit application
    F->>FB: Check auth state
    FB-->>F: User status
    
    alt User not authenticated
        F->>U: Show landing/auth page
        U->>F: Sign up/Sign in
        F->>FB: Authenticate user
        FB->>FB: Validate credentials
        FB-->>F: Auth token + user data
        F->>B: API calls with token
        B->>FB: Verify token
        FB-->>B: Token valid + user info
        B->>DB: Get/Create user profile
        DB-->>B: User data
        B-->>F: API response
    else User authenticated
        F->>U: Show dashboard
        F->>B: API calls with token
        B->>FB: Verify token
        FB-->>B: Token valid
        B-->>F: API response
    end
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-bolt-sb1-bbqks1ud
   ```

2. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Realtime Database
   - Generate service account credentials

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create `.env` file:
   ```env
   # Firebase Configuration (Service Account)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com
   FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app/

   # Firebase Web App Configuration
   FIREBASE_API_KEY=your-web-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   FIREBASE_APP_ID=your-app-id

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # JWT Configuration
   JWT_SECRET=your-super-secure-jwt-secret-key
   JWT_EXPIRES_IN=24h

   # API Configuration
   API_BASE_URL=/api/v1
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=1000

   # Logging
   LOG_LEVEL=info
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   
   Create `.env` file:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your-web-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app/
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id

   # API Configuration
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_API_TIMEOUT=10000
   ```

5. **Populate Sample Data (Optional)**
   ```bash
   cd backend
   node populate-sample-data.js
   ```

6. **Start the Development Servers**
   
   Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api/v1
   - Health Check: http://localhost:5000/health

## 🔌 API Endpoints

```mermaid
graph LR
    subgraph "Authentication"
        A1[POST /auth/register]
        A2[POST /auth/login]
        A3[POST /auth/logout]
        A4[GET /auth/me]
    end
    
    subgraph "Issues"
        B1[GET /issues]
        B2[POST /issues]
        B3[GET /issues/:id]
        B4[PUT /issues/:id]
        B5[DELETE /issues/:id]
        B6[GET /issues/trending]
        B7[POST /issues/:id/vote]
    end
    
    subgraph "Comments"
        C1[GET /comments]
        C2[POST /comments]
        C3[PUT /comments/:id]
        C4[DELETE /comments/:id]
        C5[POST /comments/:id/vote]
    end
    
    subgraph "Fixes"
        D1[GET /fixes]
        D2[POST /fixes]
        D3[PUT /fixes/:id]
        D4[DELETE /fixes/:id]
        D5[POST /fixes/:id/accept]
        D6[POST /fixes/:id/vote]
    end
    
    subgraph "Users"
        E1[GET /users]
        E2[GET /users/:id]
        E3[PUT /users/:id]
        E4[GET /users/:id/issues]
        E5[GET /users/:id/fixes]
    end
    
    subgraph "Dashboard"
        F1[GET /dashboard/stats]
        F2[GET /dashboard/recent-issues]
        F3[GET /dashboard/recent-fixes]
    end
```

## 🧩 Project Structure

```
project-bolt-sb1-bbqks1ud/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   │   ├── authController.js
│   │   │   ├── commentController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── fixController.js
│   │   │   ├── issueController.js
│   │   │   └── userController.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── routes/            # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── commentRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── fixRoutes.js
│   │   │   ├── issueRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── config/           # Configuration files
│   │   │   └── firebase.js
│   │   ├── services/         # External services
│   │   ├── utils/           # Utility functions
│   │   │   └── helpers.js
│   │   └── server.js        # Express app entry point
│   ├── package.json
│   ├── .env                 # Environment variables
│   └── populate-sample-data.js # Sample data script
│
├── frontend/                 # React Vite Application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DiscoverPage.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   ├── IssueDetailPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── LoadingPage.tsx
│   │   │   ├── MessagesPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── PostIssuePage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/          # Custom hooks
│   │   │   └── use-toast.ts
│   │   ├── lib/            # Utilities and services
│   │   │   ├── api.ts      # API service
│   │   │   ├── firebase.ts # Firebase config
│   │   │   └── utils.ts    # Helper functions
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts
│   │   ├── data/           # Mock data (for development)
│   │   │   └── mockData.ts
│   │   ├── App.tsx         # Main app component
│   │   ├── main.tsx        # App entry point
│   │   └── index.css       # Global styles
│   ├── package.json
│   ├── .env                # Environment variables
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.js  # Tailwind CSS config
│   └── tsconfig.json       # TypeScript config
│
└── README.md               # This file
```

## 🎨 Technology Stack

```mermaid
graph TB
    subgraph "Frontend Stack"
        A[React 18] --> B[TypeScript]
        B --> C[Vite]
        C --> D[Tailwind CSS]
        D --> E[Shadcn/ui]
        E --> F[Lucide Icons]
    end
    
    subgraph "Backend Stack"
        G[Node.js] --> H[Express.js]
        H --> I[Firebase Admin]
        I --> J[Joi Validation]
        J --> K[CORS & Helmet]
        K --> L[Rate Limiting]
    end
    
    subgraph "Database & Auth"
        M[Firebase Auth] --> N[Firebase Realtime DB]
        N --> O[Firebase Storage]
    end
    
    subgraph "Development Tools"
        P[ESLint] --> Q[Prettier]
        Q --> R[Nodemon]
        R --> S[PostCSS]
    end
    
    F --> G
    L --> M
```

## 🚀 Deployment

### Backend Deployment (Node.js)

1. **Environment Setup**
   - Set production environment variables
   - Update CORS origins for production domain
   - Use production Firebase credentials

2. **Platform Options**
   - **Heroku**: Easy deployment with git
   - **Railway**: Modern platform with automatic deployments
   - **DigitalOcean App Platform**: Scalable container deployment
   - **AWS/Google Cloud**: Enterprise-grade infrastructure

### Frontend Deployment (Static Site)

1. **Build the Application**
   ```bash
   cd frontend
   npm run build
   ```

2. **Platform Options**
   - **Vercel**: Optimized for React/Vite applications
   - **Netlify**: Easy static site deployment
   - **Firebase Hosting**: Integrated with Firebase backend
   - **AWS S3 + CloudFront**: Scalable static hosting

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- Unit tests for API endpoints
- Integration tests for authentication flow
- Component tests for React components
- E2E tests for critical user journeys

## 🔒 Security Features

- **Firebase Authentication**: Industry-standard auth with JWT tokens
- **Input Validation**: Joi schema validation on all inputs
- **Rate Limiting**: Prevent API abuse and DoS attacks
- **CORS Protection**: Restrict cross-origin requests
- **XSS Protection**: Helmet.js security headers
- **SQL Injection Prevention**: NoSQL database with validated inputs

## 📈 Performance Optimizations

- **Code Splitting**: React lazy loading for route components
- **Image Optimization**: WebP format with fallbacks
- **API Response Caching**: Redis caching for frequently accessed data
- **Database Indexing**: Firebase compound indexes for queries
- **Bundle Analysis**: Webpack bundle analyzer for size optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure responsive design for all new components

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Lucide](https://lucide.dev/) - Icon library

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by Bhargav**
