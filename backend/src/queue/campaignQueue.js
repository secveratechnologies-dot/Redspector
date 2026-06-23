import redis from '../config/redis.js';
import { executeCampaign } from './runnerService.js';

const QUEUE_KEY = 'queue:campaigns';
let isRunning = false;
let workerClient = null;

export const enqueueCampaign = async (campaignId) => {
  if (!redis) {
    console.error('[Queue] Redis is offline. Cannot enqueue job.');
    return;
  }
  // Initialize attempts if not set
  const attemptsKey = `job:attempts:${campaignId}`;
  const exists = await redis.exists(attemptsKey);
  if (!exists) {
    await redis.set(attemptsKey, 1);
  }

  await redis.lpush(QUEUE_KEY, campaignId);
  console.log(`[Queue] Enqueued campaign: ${campaignId}`);
};

export const startQueueWorker = async () => {
  if (isRunning) return;
  if (!redis) {
    console.warn('[Queue] Redis is offline. Worker cannot start.');
    return;
  }
  isRunning = true;
  console.log('[Queue] Worker loop started.');

  // Use a duplicated client connection to avoid blocking the main connection with brpop
  workerClient = redis.duplicate();
  workerClient.on('error', (err) => {
    console.error('[Queue Worker Redis Error]:', err.message);
  });

  // Run async worker loop
  (async () => {
    while (isRunning) {
      try {
        // brpop returns [key, value] or null if timeout (we use 2 seconds timeout)
        const result = await workerClient.brpop(QUEUE_KEY, 2);
        if (result && result[1]) {
          const campaignId = result[1];
          await executeCampaign(campaignId);
        }
      } catch (error) {
        if (!isRunning) break;
        console.error('[Queue Worker Loop Error]:', error.message);
        // Prevent tight CPU loop on error
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  })();
};

export const stopQueueWorker = () => {
  isRunning = false;
  if (workerClient) {
    try {
      workerClient.quit();
    } catch (err) {
      console.error('[Queue] Error quitting worker client:', err.message);
    }
    workerClient = null;
  }
  console.log('[Queue] Worker loop stopped.');
};
