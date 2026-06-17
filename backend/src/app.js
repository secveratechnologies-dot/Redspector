import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app = express();

// Standard middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiters
app.use('/api/auth', rateLimiter({ limit: 5, windowSeconds: 60 }));
app.use('/api', rateLimiter({ limit: 100, windowSeconds: 60 }));

// System health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Register routes
app.use('/api', routes);

// Catch-all error logging
app.use(errorHandler);

export default app;
