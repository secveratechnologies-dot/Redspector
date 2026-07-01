import json
import asyncio
import logging
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaConnectionError
from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaEventPublisher:
    def __init__(self):
        self.producer = None

    async def connect(self):
        retries = 5
        for i in range(retries):
            try:
                self.producer = AIOKafkaProducer(
                    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8')
                )
                await self.producer.start()
                logger.info("Successfully connected to Kafka")
                return
            except KafkaConnectionError:
                if i < retries - 1:
                    logger.warning(f"Kafka connection failed. Retrying in 5 seconds... ({i+1}/{retries})")
                    await asyncio.sleep(5)
                else:
                    logger.error("Failed to connect to Kafka after multiple retries")
                    raise

    async def close(self):
        if self.producer:
            await self.producer.stop()

    async def publish(self, topic: str, event_type: str, data: dict):
        if not self.producer:
            await self.connect()
        
        payload = {
            "event_type": event_type,
            "data": data
        }
        await self.producer.send_and_wait(topic, payload)

# Global publisher instance
event_publisher = KafkaEventPublisher()
