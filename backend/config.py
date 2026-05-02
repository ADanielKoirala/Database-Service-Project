import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-this-development-secret")
    database_name: str = os.getenv("DATABASE_NAME", "securedb")
    database_user: str = os.getenv("DATABASE_USER", "secureuser")
    database_password: str = os.getenv("DATABASE_PASSWORD", "securepass")
    database_host: str = os.getenv("DATABASE_HOST", "localhost")
    database_port: int = int(os.getenv("DATABASE_PORT", "5432"))
    allowed_origins: list[str] = None

    def __post_init__(self):
        origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        object.__setattr__(self, "allowed_origins", [o.strip() for o in origins.split(",") if o.strip()])


config = Config()
