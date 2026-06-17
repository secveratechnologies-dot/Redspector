import app from './app.js';
import dotenv from 'dotenv';
import prisma from './config/db.js';
import redis from './config/redis.js';
import { startQueueWorker, stopQueueWorker } from './queue/campaignQueue.js';
import { startScheduler, stopScheduler } from './queue/scheduler.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Verify PostgreSQL connection
    await prisma.$connect();
    console.log('[PostgreSQL] Database connection verified.');

    const server = app.listen(PORT, () => {
      console.log(`[Server] Listening in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Start background queue worker and scheduler
    await startQueueWorker();
    startScheduler();

    const shutdown = async () => {
      console.log('[Server] Beginning graceful termination...');
      // Stop queue worker and scheduler
      stopQueueWorker();
      stopScheduler();

      server.close(async () => {
        await prisma.$disconnect();
        console.log('[PostgreSQL] Connections disconnected.');
        if (redis) {
          await redis.quit();
          console.log('[Redis] Connections closed.');
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('[Startup Error] Boot failure:', error.message);
    process.exit(1);
  }
};

startServer();
