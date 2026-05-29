from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Admin Login Schema
class AdminLogin(BaseModel):
    username: str
    password: str

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_250g: Optional[float] = None
    price_500g: Optional[float] = None
    price_1000g: Optional[float] = None
    image_url: Optional[str] = None
    tag: Optional[str] = None
    color: Optional[str] = None
    rating: Optional[float] = 4.8
    reviews: Optional[int] = 150
    is_active: Optional[bool] = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_250g: Optional[float] = None
    price_500g: Optional[float] = None
    price_1000g: Optional[float] = None
    image_url: Optional[str] = None
    tag: Optional[str] = None
    color: Optional[str] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

# Order Item Schemas
class OrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    weight: str
    price: float
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int

    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    total_amount: float

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdateStatus(BaseModel):
    status: str

class OrderResponse(OrderBase):
    id: int
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

# Google Auth and User Schemas
class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None
    is_demo: Optional[bool] = False
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# History and Memory Schemas
class ChatMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatSessionDetailResponse(ChatSessionResponse):
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class CreateSessionRequest(BaseModel):
    id: str
    title: str

class CreateMessageRequest(BaseModel):
    role: str
    content: str

class UpdateSessionTitleRequest(BaseModel):
    title: str

class UpdateMemoryRequest(BaseModel):
    key: str
    value: str

class UserMemoryResponse(BaseModel):
    id: int
    key: str
    value: str
    updated_at: datetime

    class Config:
        from_attributes = True


