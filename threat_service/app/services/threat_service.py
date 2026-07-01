import logging
import random
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.models import Vulnerability

logger = logging.getLogger(__name__)

async def analyze_asset_and_store_threats(db: AsyncSession, tenant_id: str, asset_value: str, asset_type: str):
    """
    Mock OSINT/Threat scanner. In reality this would query Shodan, DNS, or Nmap.
    We will just simulate discovering a vulnerability.
    """
    logger.info(f"Starting threat analysis for {asset_type} asset: {asset_value}")
    
    # Simulate some logic
    possible_threats = [
        {"severity": "HIGH", "description": "Exposed RDP port detected", "source": "Shodan Mock"},
        {"severity": "MEDIUM", "description": "Missing SPF record", "source": "DNS Mock"},
        {"severity": "LOW", "description": "Outdated TLS version supported", "source": "SSL Mock"},
        None # Represents no threat found
    ]
    
    discovered_threat = random.choice(possible_threats)
    
    if discovered_threat:
        vuln = Vulnerability(
            tenant_id=tenant_id,
            asset_value=asset_value,
            severity=discovered_threat["severity"],
            description=discovered_threat["description"],
            source=discovered_threat["source"]
        )
        db.add(vuln)
        await db.commit()
        logger.info(f"Saved {discovered_threat['severity']} vulnerability for {asset_value}")
    else:
        logger.info(f"No vulnerabilities discovered for {asset_value}")
