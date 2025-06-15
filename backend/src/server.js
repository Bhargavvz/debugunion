import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, notFoundHandler, rateLimitHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import fixRoutes from './routes/fixRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 0
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    }
  });
});

// API routes
const API_BASE = process.env.API_BASE_URL || '/api/v1';

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/issues`, issueRoutes);
app.use(`${API_BASE}/comments`, commentRoutes);
app.use(`${API_BASE}/fixes`, fixRoutes);
app.use(`${API_BASE}/dashboard`, dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DevBounty API Server',
    data: {
      version: '1.0.0',
      endpoints: {
        auth: `${API_BASE}/auth`,
        users: `${API_BASE}/users`,
        issues: `${API_BASE}/issues`,
        comments: `${API_BASE}/comments`,
        fixes: `${API_BASE}/fixes`
      },
      documentation: 'https://api-docs.devbounty.com'
    }
  });
});

// API info endpoint
app.get(`${API_BASE}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DevBounty API v1',
    data: {
      version: '1.0.0',
      endpoints: [
        { path: '/auth', description: 'Authentication endpoints' },
        { path: '/users', description: 'User management endpoints' },
        { path: '/issues', description: 'Issue management endpoints' },
        { path: '/comments', description: 'Comment management endpoints' },
        { path: '/fixes', description: 'Fix management endpoints' }
      ]
    }
  });
});

// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force close server after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 DevBounty API Server is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 Base URL: http://localhost:${PORT}${API_BASE}
📚 Health Check: http://localhost:${PORT}/health
⏰ Started at: ${new Date().toISOString()}
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  console.error('Promise:', promise);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;
