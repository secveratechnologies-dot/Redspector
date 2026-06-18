from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.config import settings

from app.api.routers import auth, tenants, users
from app.infrastructure.messaging.kafka_publisher import event_publisher

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await event_publisher.connect()
    yield
    # Shutdown
    await event_publisher.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(tenants.router, prefix=f"{settings.API_V1_STR}/tenants", tags=["Tenants"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Basic health check endpoint to verify the service is running.
    """
    return {"status": "ok", "service": settings.PROJECT_NAME}
