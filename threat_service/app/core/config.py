from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RedSpectre Threat Intelligence Service"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "redspecter_threat"
    
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    
    SECRET_KEY: str = "super_secret_key_change_me_in_production_1234567890" # Matches IAM
    ALGORITHM: str = "HS256"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True

settings = Settings()
