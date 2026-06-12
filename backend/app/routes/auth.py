from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..config import settings
from ..schemas import AdminLogin, Token
from ..auth import verify_password, create_access_token, get_password_hash

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(login_data: AdminLogin):
    """Authenticate admin and return JWT access token (JSON payload)."""
    is_valid_user = login_data.username == settings.ADMIN_USERNAME
    # Check password (either plain text environment value or hashed)
    is_valid_pass = verify_password(login_data.password, settings.ADMIN_PASSWORD)
    
    if not (is_valid_user and is_valid_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": login_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/oauth-login", response_model=Token, include_in_schema=False)
def oauth_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password flow helper (Form payload)."""
    is_valid_user = form_data.username == settings.ADMIN_USERNAME
    is_valid_pass = verify_password(form_data.password, settings.ADMIN_PASSWORD)
    
    if not (is_valid_user and is_valid_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

import jwt
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import GoogleLoginRequest, AuthResponse, UserResponse, SendOtpRequest, VerifyOtpRequest, CheckEmailRequest, LoginWithPasswordRequest
from ..services.email import send_html_email
import random
import time

# Global in-memory OTP store: email -> { "code": str, "expires_at": float }
otp_store = {}

def generate_otp_email_html(otp_code: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; background-color: #faf5ff; margin: 0; padding: 0; }}
            .container {{ max-width: 500px; margin: 30px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(61, 26, 92, 0.05); border: 1px solid rgba(139, 92, 246, 0.1); }}
            .header {{ background: #faf5ff; padding: 30px 20px; text-align: center; border-bottom: 2px solid #e9d5ff; }}
            .content {{ padding: 40px 30px; text-align: center; }}
            .title {{ font-size: 20px; color: #1e1b4b; margin-top: 0; font-weight: 700; }}
            .otp-box {{ background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 15px 25px; margin: 25px auto; display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #3d1a5c; }}
            .footer {{ background: #faf5ff; padding: 20px; text-align: center; border-top: 1px solid #f3e8ff; font-size: 11px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="color: #7c3aed; margin: 0; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">KALINDI</h2>
                <p style="color: #7c3aed; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Luxury Dry Fruits & Wellness</p>
            </div>
            <div class="content">
                <h3 class="title">Verify Your Email Address</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">Please use the following One-Time Password (OTP) to complete your sign-in. This code is valid for 5 minutes.</p>
                <div class="otp-box">{otp_code}</div>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">If you did not request this code, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Kalindi Luxury. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


@router.post("/google-login", response_model=AuthResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Authenticate via Google JWT token or simulated concierge demo."""
    email = None
    name = None
    picture = None
    google_id = None

    if payload.is_demo:
        # High fidelity Concierge Demo Sign-In simulation
        email = payload.email or "connoisseur@kalindi.com"
        name = payload.name or "Guest Connoisseur"
        picture = payload.picture or "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
        google_id = "demo-google-id-" + email
    elif payload.credential:
        try:
            # Decode the Google ID token
            decoded = jwt.decode(payload.credential, options={"verify_signature": False})
            email = decoded.get("email")
            name = decoded.get("name")
            picture = decoded.get("picture")
            google_id = decoded.get("sub")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Google credential token: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication requires either a Google credential or demo simulation flag."
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address not found in credential."
        )

    # Search for user in database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            picture=picture,
            google_id=google_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Sync profile changes
        user.name = name or user.name
        user.picture = picture or user.picture
        if google_id:
            user.google_id = google_id
        db.commit()
        db.refresh(user)

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/send-otp")
def send_otp(payload: SendOtpRequest):
    """Generate a 6-digit OTP code, save to memory store, and email to customer."""
    email = payload.email.strip().lower()
    
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Save to memory (expires in 5 minutes)
    otp_store[email] = {
        "code": code,
        "expires_at": time.time() + 300
    }
    
    # Render HTML content
    html_content = generate_otp_email_html(code)
    subject = f"{code} is your Kalindi verification code"
    
    # Send email
    email_sent = send_html_email(subject, html_content, email)
    
    # Crucial dev fallback: print code in logs so user can easily test on local
    print("=" * 60)
    print(f"[OTP] Sent code {code} to {email} (SMTP sent: {email_sent})")
    print("=" * 60)
    
    return {"message": "OTP sent successfully", "dev_fallback": not email_sent}


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verify OTP, then find or create the user and return access token."""
    email = payload.email.strip().lower()
    code = payload.code.strip()
    name = payload.name.strip() if payload.name else None
    
    # Fetch from memory store
    otp_data = otp_store.get(email)
    if not otp_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested for this email address."
        )
        
    # Check expiry
    if time.time() > otp_data["expires_at"]:
        # Delete expired OTP
        otp_store.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new one."
        )
        
    # Check match
    if otp_data["code"] != code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please check and try again."
        )
        
    # Successful verification! Remove OTP from store.
    otp_store.pop(email, None)
    
    # Search for user or create new one
    user = db.query(User).filter(User.email == email).first()
    picture = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120"
    
    if not user:
        user = User(
            email=email,
            name=name or "Kalindi Patron",
            picture=picture,
            google_id=None,
            hashed_password=get_password_hash(payload.password) if payload.password else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Sync profile changes
        user.name = name or user.name
        if payload.password:
            user.hashed_password = get_password_hash(payload.password)
        db.commit()
        db.refresh(user)
        
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/check-email")
def check_email(payload: CheckEmailRequest, db: Session = Depends(get_db)):
    """Check if email already exists in users database."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    return {"exists": user is not None}


@router.post("/login-with-password", response_model=AuthResponse)
def login_with_password(payload: LoginWithPasswordRequest, db: Session = Depends(get_db)):
    """Log in user using email and password."""
    email = payload.email.strip().lower()
    password = payload.password
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )
        
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account does not have a password set. Please sign in via Google or use OTP."
        )
        
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )
        
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


