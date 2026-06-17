# RedSpecter Security Dashboard - Backend

A production-ready REST API built with Node.js, Express, PostgreSQL, and Redis to support the RedSpecter compliance and security scanning portal.

## Tech Stack

- **Node.js**: Server runtime environment.
- **Express.js**: Backend REST framework.
- **Prisma ORM**: PostgreSQL database manager.
- **Redis**: Caching and in-memory queue storage.
- **Docker**: Local containerization runtime.

## Scaffolding Setup

### Prerequisites

- Node.js (v20+)
- PostgreSQL (v15+)
- Redis (v7+)
- Homebrew (macOS)

### Getting Started

1. **Install Local Services**:
   Ensure Postgres and Redis services are active:
   ```bash
   brew services start postgresql@15
   brew services start redis
   ```

2. **Sync database schemas**:
   Make sure you configure parameters inside `.env` correctly. Run:
   ```bash
   npx prisma db push
   ```

3. **Start local service**:
   ```bash
   npm run dev
   ```
