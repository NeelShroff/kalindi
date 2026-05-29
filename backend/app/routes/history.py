from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import ChatSession, ChatMessage, UserMemory, User
from ..schemas import (
    ChatSessionResponse,
    ChatSessionDetailResponse,
    CreateSessionRequest,
    ChatMessageResponse,
    CreateMessageRequest,
    UpdateSessionTitleRequest,
    UpdateMemoryRequest,
    UserMemoryResponse
)
from ..auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all chat sessions for the logged-in user, ordered by most recent."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return sessions

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new chat session for the logged-in user."""
    # Check if session already exists
    existing = db.query(ChatSession).filter(ChatSession.id == payload.id).first()
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this session"
            )
        return existing

    session = ChatSession(
        id=payload.id,
        user_id=current_user.id,
        title=payload.title,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_session_details(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details for a specific chat session, including all its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this session"
        )
    return session

@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session_title(
    session_id: str,
    payload: UpdateSessionTitleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename/update the title of a specific chat session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this session"
        )
    
    session.title = payload.title
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a specific chat session and all its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this session"
        )
    
    db.delete(session)
    db.commit()
    return None

@router.post("/sessions/{session_id}/message", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def append_message(
    session_id: str,
    payload: CreateMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Append a new user or assistant message to an active chat session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        # Auto-create session if it doesn't exist
        session = ChatSession(
            id=session_id,
            user_id=current_user.id,
            title="Active Chat Session",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this session"
        )

    message = ChatMessage(
        session_id=session_id,
        role=payload.role,
        content=payload.content,
        created_at=datetime.utcnow()
    )
    
    # Touch session's updated_at timestamp
    session.updated_at = datetime.utcnow()
    
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

@router.get("/memory", response_model=List[UserMemoryResponse])
def get_user_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all long-term personalization memories for the current user."""
    memories = db.query(UserMemory).filter(UserMemory.user_id == current_user.id).all()
    return memories

@router.post("/memory", response_model=UserMemoryResponse)
def update_user_memory(
    payload: UpdateMemoryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a long-term memory element for the user (e.g. goal, taste, recipient)."""
    memory = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == current_user.id, UserMemory.key == payload.key)
        .first()
    )
    if memory:
        memory.value = payload.value
        memory.updated_at = datetime.utcnow()
    else:
        memory = UserMemory(
            user_id=current_user.id,
            key=payload.key,
            value=payload.value,
            updated_at=datetime.utcnow()
        )
        db.add(memory)
        
    db.commit()
    db.refresh(memory)
    return memory
