import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initializeDefaultAdmin } from './services/auth.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://freshmarket-admin-frontend-693944688614.us-central1.run.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'FreshMarket Admin API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`\n🚀 Admin API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);

      // Inicializar usuario admin por defecto en background (no bloquear inicio)
      initializeDefaultAdmin().catch(err => {
        console.error('⚠️  Error initializing default admin:', err.message);
        console.log('ℹ️  You can create an admin user manually via /api/auth/setup');
      });
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
