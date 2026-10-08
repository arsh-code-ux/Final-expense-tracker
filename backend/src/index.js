require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Enhanced logging system
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`)
};

let memoryServer = null;

// Environment validation
function validateEnvironment() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  log.success('Environment validation passed');
}

// Database connection with retry logic
async function connectDatabase() {
  const maxRetries = parseInt(process.env.DB_RETRY_ATTEMPTS) || 5;
  const timeout = parseInt(process.env.DB_TIMEOUT) || 30000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log.info(`Database connection attempt ${attempt}/${maxRetries}...`);
      
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: timeout,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      });
      
      log.success('✅ Connected to MongoDB successfully');
      return;
      
    } catch (error) {
      log.error(`Database connection attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        log.warn('Falling back to an in-memory MongoDB instance so the backend can still start locally');

        try {
          memoryServer = await MongoMemoryServer.create();
          const memoryUri = memoryServer.getUri('track-expense');

          await mongoose.connect(memoryUri, {
            serverSelectionTimeoutMS: timeout,
            maxPoolSize: 10
          });

          process.env.MONGODB_URI = memoryUri;
          log.success('✅ Connected to in-memory MongoDB successfully');
          return;
        } catch (fallbackError) {
          log.error(`❌ In-memory MongoDB fallback failed: ${fallbackError.message}`);
          log.error('❌ All database connection attempts failed');
          process.exit(1);
        }
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      log.info(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Application startup
async function startServer() {
  try {
    log.info('🚀 Starting ExpenseTracker Backend Server...');
    log.info('='.repeat(50));
    
    // Validate environment
    validateEnvironment();
    
    // Debug environment
    log.info('🔧 Environment Configuration:');
    log.info(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    log.info(`   PORT: ${process.env.PORT || 3005}`);
    log.info(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}`);
    log.info(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'MISSING'}`);
    log.info(`   APP_NAME: ${process.env.APP_NAME || 'ExpenseTracker'}`);
    log.info(`   APP_VERSION: ${process.env.APP_VERSION || '1.0.0'}`);
    
    // Connect to database
    await connectDatabase();
    
    // Import routes
    const authRoutes = require('./routes/auth');
    const transactionRoutes = require('./routes/transactions');
    const budgetRoutes = require('./routes/budgets');
    const savingsGoalRoutes = require('./routes/savingsGoals');
    const alertRoutes = require('./routes/alerts');
    const chatRoutes = require('./routes/chat');
    const projectRoutes = require('./routes/projects');
    const aiRoutes = require('./routes/ai');
    const geminiRoutes = require('./routes/gemini');
    const filesRoutes = require('./routes/files');
    const notesRoutes = require('./routes/notes');
    const preferencesRoutes = require('./routes/preferences');
    const analyticsRoutes = require('./routes/analytics');
    
    // Create Express app
    const app = express();
    
    // Enhanced CORS configuration with origin function
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://jade-zabaione-6618eb.netlify.app',
      'https://animated-tulumba-6ec4e6.netlify.app',
      'https://peppy-sprite-12003f.netlify.app',
      'https://arsh-code-ux-track-expense.netlify.app',
      'https://track-expenses-079.netlify.app',
      'https://web-production-296b2.up.railway.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        // Allow local Vite development servers regardless of the selected port.
        if (origin.match(/^https?:\/\/localhost:\d+$/) || allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        }
        
        // Check if origin matches patterns
        if (origin.match(/\.netlify\.app$/) || 
            origin.match(/\.vercel\.app$/) || 
            origin.match(/\.railway\.app$/) ||
            origin.match(/\.onrender\.com$/)) {
          return callback(null, true);
        }
        
        // Log rejected origin for debugging
        log.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
    
    // Apply CORS before any routes
    app.use(cors(corsOptions));
    
    // Explicit OPTIONS handler for all routes
    app.options('*', cors(corsOptions));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging middleware
    app.use((req, res, next) => {
      log.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
    
    // Enhanced health check endpoint
    app.get('/health', (req, res) => {
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0',
        database: mongoose.connection.readyState === 1
          ? (memoryServer ? 'connected-memory' : 'connected')
          : 'disconnected',
        memory: process.memoryUsage(),
        pid: process.pid
      };
      
      res.json(healthData);
    });

    // Root landing page for browser visits to the service URL
    app.get('/', (req, res) => {
      res.type('html').send(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Track Expense API</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                color: #0f172a;
              }
              .card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 32px;
                max-width: 560px;
                box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
              }
              h1 { margin-top: 0; }
              a { color: #2563eb; }
              code {
                background: #f1f5f9;
                padding: 2px 6px;
                border-radius: 6px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Track Expense backend is running</h1>
              <p>This service exposes the API for the Track Expense app.</p>
              <p>Health check: <a href="/health">/health</a></p>
              <p>API base: <code>/api</code></p>
            </div>
          </body>
        </html>
      `);
    });
    
    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/budgets', budgetRoutes);
    app.use('/api/savings-goals', savingsGoalRoutes);
    app.use('/api/alerts', alertRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/gemini', geminiRoutes);
    app.use('/api/files', filesRoutes);
    // Serve uploaded files
    app.use('/uploads', express.static(require('path').join(__dirname, '..', 'uploads')));
    app.use('/api/notes', notesRoutes);
    app.use('/api/preferences', preferencesRoutes);
    app.use('/api/analytics', analyticsRoutes);
    
    // Global error handling middleware
    app.use((err, req, res, next) => {
      log.error(`Global error handler: ${err.message}`);
      log.error(`Stack trace: ${err.stack}`);
      
      // Don't expose stack trace in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: 'Internal server error',
        message: isDevelopment ? err.message : 'Something went wrong',
        ...(isDevelopment && { stack: err.stack })
      });
    });
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
      });
    });
    
    const PORT = process.env.PORT || 3005;
    
    // Start server with error handling
    const server = app.listen(PORT, () => {
      log.success('🎉 Server started successfully!');
      log.success(`🌐 Server running on http://localhost:${PORT}`);
      log.success('📡 API endpoints available:');
      log.info(`   - Health: http://localhost:${PORT}/health`);
      log.info(`   - Auth: http://localhost:${PORT}/api/auth`);
      log.info(`   - Transactions: http://localhost:${PORT}/api/transactions`);
      log.info(`   - Budgets: http://localhost:${PORT}/api/budgets`);
      log.info(`   - Alerts: http://localhost:${PORT}/api/alerts`);
      log.info(`   - Chat: http://localhost:${PORT}/api/chat`);
      log.info('='.repeat(50));
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        log.error(`❌ Port ${PORT} is already in use`);
        log.error('Please check if another instance is running or use a different port');
      } else {
        log.error(`❌ Server error: ${error.message}`);
      }
      process.exit(1);
    });
    
    // Graceful shutdown (modern mongoose: .close() returns a Promise)
    const gracefulShutdown = async (signal) => {
      log.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        // Stop accepting new connections
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) return reject(err);
            resolve();
          });
        });

        // Close mongoose connection (no callback in newer mongoose)
        await mongoose.connection.close();

        if (memoryServer) {
          await memoryServer.stop();
        }

        log.success('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        log.error(`Error during graceful shutdown: ${err && err.message ? err.message : err}`);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.error(`Uncaught Exception: ${error.message}`);
      log.error(`Stack: ${error.stack}`);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
      process.exit(1);
    });
    
  } catch (error) {
    log.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();
