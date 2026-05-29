from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..config import settings
from ..schemas import AdminLogin, Token
from ..auth import verify_password, create_access_token

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
from ..schemas import GoogleLoginRequest, AuthResponse, UserResponse

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

