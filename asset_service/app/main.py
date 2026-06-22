from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Basic health check endpoint to verify the service is running.
    """
    return {"status": "ok", "service": settings.PROJECT_NAME}
