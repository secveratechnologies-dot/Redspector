import json
from aiokafka import AIOKafkaProducer
from app.core.config import settings

class KafkaEventPublisher:
    def __init__(self):
        self.producer = None

    async def connect(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()

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
