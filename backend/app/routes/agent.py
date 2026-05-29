from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..services.agent import generate_chat_response, generate_chat_stream_response

router = APIRouter(prefix="/api/agent", tags=["agent"])

class Message(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Luxury AI Concierge chat endpoint.
    Accepts chat history and generates a response leveraging Groq (with local fallback).
    """
    try:
        # Convert Pydantic schemas to standard dictionaries for the service
        msg_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
        
        # Generate the agent response
        reply = await generate_chat_response(msg_dicts, db, user_id=payload.user_id)
        
        return ChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred in AI Concierge service: {str(e)}"
        )

@router.post("/chat-stream")
async def chat_stream_with_agent(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Streaming Luxury AI Concierge chat endpoint.
    Returns a Server-Sent Events stream of the AI typing out its answer in real-time.
    """
    try:
        msg_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
        
        generator = generate_chat_stream_response(msg_dicts, db, user_id=payload.user_id)
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Streaming service error: {str(e)}"
        )


