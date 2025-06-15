#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper function to log with colors
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Read file content
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
};

// Write file content
const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log.error(`Failed to write file: ${filePath}`);
    console.error(error.message);
    return false;
  }
};

// Validate Firebase project ID
const validateFirebaseProjectId = (projectId) => {
  const regex = /^[a-z][a-z0-9-]*[a-z0-9]$/;
  return regex.test(projectId) && projectId.length >= 6 && projectId.length <= 30;
};

// Validate email format
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Generate JWT secret
const generateJWTSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Setup environment file
const setupEnvironment = async () => {
  log.section('🔧 Environment Configuration');

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  if (fileExists(envPath)) {
    const overwrite = await question(`${colors.yellow}⚠${colors.reset} .env file already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Skipping environment setup');
      return true;
    }
  }

  if (!fileExists(envExamplePath)) {
    log.error('.env.example file not found');
    return false;
  }

  let envContent = readFile(envExamplePath);
  if (!envContent) {
    log.error('Failed to read .env.example file');
    return false;
  }

  console.log('\nPlease provide the following configuration values:');
  console.log(`${colors.cyan}You can find these values in your Firebase project settings.${colors.reset}\n`);

  // Firebase configuration
  const firebaseProjectId = await question('Firebase Project ID: ');
  if (!validateFirebaseProjectId(firebaseProjectId)) {
    log.error('Invalid Firebase Project ID format');
    return false;
  }

  const firebasePrivateKeyId = await question('Firebase Private Key ID: ');
  if (!firebasePrivateKeyId.trim()) {
    log.error('Firebase Private Key ID is required');
    return false;
  }

  console.log('\nPaste your Firebase Private Key (including BEGIN/END lines):');
  const firebasePrivateKey = await question('Firebase Private Key: ');
  if (!firebasePrivateKey.includes('BEGIN PRIVATE KEY')) {
    log.error('Invalid Firebase Private Key format');
    return false;
  }

  const firebaseClientEmail = await question('Firebase Client Email: ');
  if (!validateEmail(firebaseClientEmail)) {
    log.error('Invalid Firebase Client Email format');
    return false;
  }

  const firebaseClientId = await question('Firebase Client ID: ');
  if (!firebaseClientId.trim()) {
    log.error('Firebase Client ID is required');
    return false;
  }

  const firebaseDatabaseURL = await question(`Firebase Database URL (https://${firebaseProjectId}-default-rtdb.firebaseio.com/): `) ||
    `https://${firebaseProjectId}-default-rtdb.firebaseio.com/`;

  // Server configuration
  const port = await question('Server Port (5000): ') || '5000';
  const corsOrigin = await question('CORS Origin (http://localhost:5173): ') || 'http://localhost:5173';

  // Generate JWT secret
  const jwtSecret = generateJWTSecret();
  log.info('Generated secure JWT secret');

  // Replace values in env content
  envContent = envContent
    .replace('your-firebase-project-id', firebaseProjectId)
    .replace('your-private-key-id', firebasePrivateKeyId)
    .replace('"-----BEGIN PRIVATE KEY-----\\nyour-private-key-here\\n-----END PRIVATE KEY-----\\n"', `"${firebasePrivateKey.replace(/\n/g, '\\n')}"`)
    .replace('firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com', firebaseClientEmail)
    .replace('your-client-id', firebaseClientId)
    .replace('https://your-project-default-rtdb.firebaseio.com/', firebaseDatabaseURL)
    .replace('5000', port)
    .replace('http://localhost:5173', corsOrigin)
    .replace('your-super-secret-jwt-key-here', jwtSecret);

  // Write .env file
  if (writeFile(envPath, envContent)) {
    log.success('Environment file created successfully');
    return true;
  }

  return false;
};

// Check dependencies
const checkDependencies = async () => {
  log.section('📦 Dependency Check');

  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fileExists(packageJsonPath)) {
    log.error('package.json not found');
    return false;
  }

  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fileExists(nodeModulesPath)) {
    log.warning('node_modules not found');
    log.info('Run "npm install" to install dependencies');
    return false;
  }

  log.success('Dependencies are installed');
  return true;
};

// Create initial database structure
const createDatabaseStructure = () => {
  log.section('🗄️ Database Structure');

  const dbStructurePath = path.join(__dirname, 'database-structure.json');

  const dbStructure = {
    "users": {
      ".info": "User profiles and authentication data"
    },
    "issues": {
      ".info": "Developer issues and problems"
    },
    "comments": {
      ".info": "Comments on issues"
    },
    "fixes": {
      ".info": "Solutions submitted for issues"
    },
    "notifications": {
      ".info": "User notifications"
    },
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
  };

  if (writeFile(dbStructurePath, JSON.stringify(dbStructure, null, 2))) {
    log.success('Database structure file created');
    log.info('Import this structure to your Firebase Realtime Database');
    return true;
  }

  return false;
};

// Create startup script
const createStartupScript = () => {
  log.section('🚀 Startup Script');

  const startupScriptPath = path.join(__dirname, 'start.sh');
  const startupScript = `#!/bin/bash

# DevBounty Backend Startup Script
echo "🚀 Starting DevBounty Backend API..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please run 'node setup.js' first"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
if [ "$1" == "dev" ]; then
    echo "🔧 Starting in development mode..."
    npm run dev
else
    echo "🌟 Starting in production mode..."
    npm start
fi
`;

  if (writeFile(startupScriptPath, startupScript)) {
    // Make script executable
    try {
      fs.chmodSync(startupScriptPath, '755');
      log.success('Startup script created (start.sh)');
      return true;
    } catch (error) {
      log.warning('Startup script created but could not make executable');
      return true;
    }
  }

  return false;
};

// Display setup completion
const displayCompletion = () => {
  log.section('✅ Setup Complete!');

  console.log(`
${colors.green}🎉 DevBounty Backend API is ready to go!${colors.reset}

${colors.bright}Next steps:${colors.reset}
1. Install dependencies: ${colors.cyan}npm install${colors.reset}
2. Start development server: ${colors.cyan}npm run dev${colors.reset}
3. Or use the startup script: ${colors.cyan}./start.sh dev${colors.reset}

${colors.bright}Useful commands:${colors.reset}
• ${colors.cyan}npm run dev${colors.reset}     - Start development server
• ${colors.cyan}npm start${colors.reset}       - Start production server
• ${colors.cyan}npm test${colors.reset}        - Run tests (when available)

${colors.bright}API Endpoints:${colors.reset}
• Health Check: ${colors.cyan}http://localhost:5000/health${colors.reset}
• API Base: ${colors.cyan}http://localhost:5000/api/v1${colors.reset}
• Documentation: Check the README.md file

${colors.bright}Firebase Setup:${colors.reset}
1. Import ${colors.cyan}database-structure.json${colors.reset} to your Firebase Realtime Database
2. Configure database rules as described in README.md
3. Enable Authentication in your Firebase console

${colors.yellow}⚠ Important:${colors.reset}
• Keep your .env file secure and never commit it to version control
• Set up proper Firebase database rules for production
• Configure CORS origins for your frontend domain

${colors.green}Happy coding! 🚀${colors.reset}
  `);
};

// Main setup function
const main = async () => {
  console.clear();

  log.title('🔧 DevBounty Backend API Setup');
  console.log(`${colors.cyan}Welcome to the DevBounty Backend API setup wizard!${colors.reset}`);
  console.log(`${colors.cyan}This will help you configure your environment and get started.${colors.reset}\n`);

  try {
    // Check dependencies
    await checkDependencies();

    // Setup environment
    const envSetup = await setupEnvironment();
    if (!envSetup) {
      log.error('Environment setup failed');
      process.exit(1);
    }

    // Create database structure
    createDatabaseStructure();

    // Create startup script
    createStartupScript();

    // Display completion message
    displayCompletion();

  } catch (error) {
    log.error('Setup failed');
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nSetup cancelled by user');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nSetup terminated');
  rl.close();
  process.exit(0);
});

// Run setup
main().catch((error) => {
  log.error('Unexpected error during setup');
  console.error(error);
  process.exit(1);
});
