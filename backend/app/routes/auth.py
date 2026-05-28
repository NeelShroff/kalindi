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
