import os
import warnings
from dotenv import load_dotenv

load_dotenv()

class Settings:
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "kalindi_luxury_secret_super_key_2026_dry_fruits")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    # Reduced from 1440 (24h) to 60 minutes for tighter admin session security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    # Store the raw value from .env — auth.py's verify_password handles bcrypt vs plain-text detection
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")

    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587) if os.getenv("SMTP_PORT") else 587)
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")
    OWNER_EMAIL: str = os.getenv("OWNER_EMAIL", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder_key")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")

    # Environment flag: controls mock payment bypass and other dev-only features.
    # Set to "production" on your live server via environment variable.
    APP_ENV: str = os.getenv("APP_ENV", "development")

settings = Settings()

# ── Security warnings on startup ──────────────────────────────────────────────
_DEFAULT_JWT = "kalindi_luxury_secret_super_key_2026_dry_fruits"
_DEFAULT_PASS = "admin123"

if settings.APP_ENV == "production":
    if settings.JWT_SECRET == _DEFAULT_JWT:
        raise RuntimeError(
            "SECURITY ERROR: JWT_SECRET is set to the insecure default value. "
            "Set a strong, random JWT_SECRET environment variable before deploying to production."
        )
    if settings.ADMIN_PASSWORD == _DEFAULT_PASS:
        raise RuntimeError(
            "SECURITY ERROR: ADMIN_PASSWORD is set to the insecure default 'admin123'. "
            "Set a strong ADMIN_PASSWORD environment variable before deploying to production."
        )
else:
    # Development mode — warn but don't block
    if settings.JWT_SECRET == _DEFAULT_JWT:
        warnings.warn(
            "[DEV] JWT_SECRET is using the default insecure value. "
            "Set APP_ENV=production and a strong JWT_SECRET before going live.",
            stacklevel=1
        )
    if settings.ADMIN_PASSWORD == _DEFAULT_PASS:
        warnings.warn(
            "[DEV] ADMIN_PASSWORD is 'admin123'. "
            "Set a strong ADMIN_PASSWORD before going live.",
            stacklevel=1
        )
