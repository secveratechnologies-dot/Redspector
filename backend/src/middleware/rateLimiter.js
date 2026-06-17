import redis from '../config/redis.js';

export const rateLimiter = ({ limit, windowSeconds }) => {
  return async (req, res, next) => {
    if (!redis) {
      // Fallback gracefully if Redis is offline
      return next();
    }

    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const key = `rate:limit:${req.originalUrl}:${ip}`;
      
      const current = await redis.incr(key);
      
      if (current === 1) {
        // Set window expiration on first request
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);

      // Set standard headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
      res.setHeader('X-RateLimit-Reset', ttl);

      if (current > limit) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfterSeconds: ttl
        });
      }

      next();
    } catch (error) {
      console.error('[RateLimiter Error] Enforce failure:', error.message);
      next(); // Fallback gracefully on internal cache failure
    }
  };
};
