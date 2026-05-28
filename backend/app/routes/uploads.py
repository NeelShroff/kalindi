import os
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from ..auth import get_current_admin

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static", "uploads")

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    admin: str = Depends(get_current_admin)
):
    """Uploads a product image and returns the static file URL (Admin Protected)."""
    # Create upload dir if it doesn't exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only image files (jpg, png, webp, gif) are allowed."
        )
        
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    # Return the file URL path
    # Frontend can load it as http://localhost:8000/static/uploads/filename
    image_url = f"/static/uploads/{unique_filename}"
    return {"image_url": image_url}
