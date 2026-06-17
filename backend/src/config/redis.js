import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn(`[Redis] Connection failed after ${times} retries. Continuing without active cache.`);
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redis.on('error', (err) => {
    console.error('[Redis] Error:', err.message);
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected to cache server.');
  });
} catch (error) {
  console.error('[Redis] Initialization failure:', error.message);
  redis = null;
}

export default redis;
