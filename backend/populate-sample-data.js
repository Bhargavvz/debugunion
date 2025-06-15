import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

const sampleData = {
  users: {
    'user1': {
      id: 'user1',
      username: 'johndev',
      email: 'john@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      xp: 1250,
      level: 3,
      bountyEarned: 450,
      badges: ['first-issue', 'bug-hunter'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    'user2': {
      id: 'user2',
      username: 'sararoot',
      email: 'sara@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
      xp: 2100,
      level: 4,
      bountyEarned: 780,
      badges: ['first-issue', 'bug-hunter', 'helping-hand'],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    'user3': {
      id: 'user3',
      username: 'alexcode',
      email: 'alex@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      xp: 890,
      level: 2,
      bountyEarned: 200,
      badges: ['first-issue'],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  issues: {
    'issue1': {
      id: 'issue1',
      title: 'React useState hook not updating state correctly',
      description: 'I have a component where the useState hook is not updating the state when I call the setter function. The state remains the same even after multiple calls.',
      category: 'bug',
      priority: 'high',
      status: 'open',
      bounty: 100,
      tags: ['react', 'hooks', 'javascript'],
      authorId: 'user1',
      views: 45,
      upvotes: 8,
      comments: ['comment1', 'comment2'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    'issue2': {
      id: 'issue2',
      title: 'How to implement dark mode with Tailwind CSS?',
      description: 'I want to add a dark mode toggle to my Next.js application using Tailwind CSS. What is the best approach to implement this functionality?',
      category: 'question',
      priority: 'medium',
      status: 'open',
      bounty: 50,
      tags: ['tailwind', 'css', 'nextjs', 'dark-mode'],
      authorId: 'user2',
      views: 67,
      upvotes: 12,
      comments: ['comment3'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    'issue3': {
      id: 'issue3',
      title: 'Add TypeScript support to existing JavaScript project',
      description: 'Our team wants to gradually migrate our JavaScript codebase to TypeScript. Looking for best practices and a step-by-step approach.',
      category: 'feature',
      priority: 'medium',
      status: 'in-progress',
      bounty: 200,
      tags: ['typescript', 'javascript', 'migration'],
      authorId: 'user3',
      views: 34,
      upvotes: 6,
      comments: [],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    'issue4': {
      id: 'issue4',
      title: 'API rate limiting best practices for Node.js',
      description: 'What are the best practices for implementing rate limiting in a Node.js Express API? Looking for recommendations on libraries and patterns.',
      category: 'discussion',
      priority: 'low',
      status: 'open',
      bounty: 75,
      tags: ['nodejs', 'express', 'api', 'rate-limiting'],
      authorId: 'user1',
      views: 23,
      upvotes: 4,
      comments: [],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  comments: {
    'comment1': {
      id: 'comment1',
      issueId: 'issue1',
      authorId: 'user2',
      content: 'This usually happens when you have a stale closure. Make sure you are not accessing the state variable directly inside event handlers.',
      votes: 5,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    'comment2': {
      id: 'comment2',
      issueId: 'issue1',
      authorId: 'user3',
      content: 'You might want to use the functional update pattern: setState(prev => !prev) instead of setState(!state)',
      votes: 3,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
    },
    'comment3': {
      id: 'comment3',
      issueId: 'issue2',
      authorId: 'user1',
      content: 'Check out the official Tailwind docs on dark mode. You can use the "dark" class strategy or media query strategy.',
      votes: 2,
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
    }
  },
  fixes: {
    'fix1': {
      id: 'fix1',
      issueId: 'issue1',
      authorId: 'user2',
      title: 'Fix useState closure issue',
      description: 'Use functional updates to avoid stale closures when updating state.',
      code: `// Instead of this:
const [count, setCount] = useState(0);
const handleClick = () => setCount(count + 1);

// Use this:
const handleClick = () => setCount(prev => prev + 1);`,
      isAccepted: false,
      votes: 4,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    'fix2': {
      id: 'fix2',
      issueId: 'issue2',
      authorId: 'user3',
      title: 'Tailwind Dark Mode Implementation',
      description: 'Complete dark mode setup with theme toggle component.',
      code: `// Add to tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ... rest of config
}

// Theme toggle component
export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  return (
    <button onClick={toggleTheme}>
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}`,
      isAccepted: true,
      votes: 8,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    }
  }
};

async function populateData() {
  try {
    console.log('🌱 Populating sample data...');
    
    // Clear existing data (optional)
    await db.ref().set(null);
    
    // Add sample data
    await db.ref().set(sampleData);
    
    console.log('✅ Sample data populated successfully!');
    console.log('📊 Data includes:');
    console.log(`   - ${Object.keys(sampleData.users).length} users`);
    console.log(`   - ${Object.keys(sampleData.issues).length} issues`);
    console.log(`   - ${Object.keys(sampleData.comments).length} comments`);
    console.log(`   - ${Object.keys(sampleData.fixes).length} fixes`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  }
}

populateData();
