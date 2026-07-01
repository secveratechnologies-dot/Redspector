import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer
import json

from app.core.config import settings
from app.domain.schemas import AssetCreatedEvent
from app.services.threat_service import analyze_asset_and_store_threats
from app.infrastructure.database.session import AsyncSessionLocal

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def consume_asset_events():
    consumer = AIOKafkaConsumer(
        "asset.events",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="threat_service_group",
        value_deserializer=lambda v: json.loads(v.decode('utf-8')),
        auto_offset_reset="latest" # We don't want to re-process historical mock events on restart
    )
    
    # Retry loop for Kafka connection
    for _ in range(5):
        try:
            await consumer.start()
            logger.info("Threat Service successfully connected to Kafka!")
            break
        except Exception as e:
            logger.error(f"Kafka connection failed, retrying in 5s... {e}")
            await asyncio.sleep(5)
    else:
        logger.error("Failed to connect to Kafka after 5 attempts.")
        return

    try:
        async for msg in consumer:
            data = msg.value
            if data.get("event_type") == "AssetCreated":
                logger.info(f"Received AssetCreated event for: {data.get('value')}")
                # We need a new DB session for background tasks
                async with AsyncSessionLocal() as db:
                    await analyze_asset_and_store_threats(
                        db=db,
                        tenant_id=data.get("tenant_id"),
                        asset_value=data.get("value"),
                        asset_type=data.get("type")
                    )
    finally:
        await consumer.stop()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the Kafka consumer background task
    task = asyncio.create_task(consume_asset_events())
    yield
    # Cancel task on shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

from app.api.routers import threats
app.include_router(threats.router, prefix=f"{settings.API_V1_STR}/threats", tags=["threats"])

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}
