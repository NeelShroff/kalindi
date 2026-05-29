import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "kalindi_luxury_secret_super_key_2026_dry_fruits")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
    
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587) if os.getenv("SMTP_PORT") else 587)
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")
    OWNER_EMAIL: str = os.getenv("OWNER_EMAIL", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

settings = Settings()

