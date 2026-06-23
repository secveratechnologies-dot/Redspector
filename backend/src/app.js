import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import prisma from './config/db.js';
import redis from './config/redis.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();

// High-precision performance tracing
app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`[Trace] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration.toFixed(2)}ms`);
  });
  next();
});

// Standard middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiters
app.use('/api/auth', rateLimiter({ limit: 5, windowSeconds: 60 }));
app.use('/api', rateLimiter({ limit: 100, windowSeconds: 60 }));

app.get('/ping', (req, res) => res.send('pong'));

// Active health check for database and Redis cache
app.get('/health', async (req, res) => {
  let dbStatus = 'DOWN';
  let cacheStatus = 'DOWN';
  let statusCode = 200;

  try {
    // Try to run a raw query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'UP';
  } catch (error) {
    console.error('[Health Check Failure] Database connectivity check failed:', error.message);
    statusCode = 500;
  }

  try {
    if (redis) {
      await redis.ping();
      cacheStatus = 'UP';
    }
  } catch (error) {
    console.error('[Health Check Failure] Redis connectivity check failed:', error.message);
    statusCode = 500;
  }

  res.status(statusCode).json({
    status: dbStatus === 'UP' && cacheStatus === 'UP' ? 'UP' : 'DEGRADED',
    timestamp: new Date(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      redis: cacheStatus
    }
  });
});

// Register routes
app.use('/api', routes);

// Catch-all error logging
app.use(errorHandler);

export default app;
