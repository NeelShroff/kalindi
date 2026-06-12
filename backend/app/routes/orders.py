import razorpay
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Order, OrderItem, Product, User
from ..schemas import OrderCreate, OrderResponse, OrderUpdateStatus
from ..auth import get_current_admin
from ..services.email import send_order_notifications
from ..config import settings

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Submits a customer order, generates a Razorpay order ID, and saves the order with 'pending_payment' status."""
    # 1. Create Razorpay order ID
    razorpay_order_id = None
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_ID != "rzp_test_placeholder_key":
        try:
            # Amount in paise (₹1 = 100 paise)
            amount_in_paise = int(order_in.total_amount * 100)
            razorpay_order = razorpay_client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "payment_capture": 1
            })
            razorpay_order_id = razorpay_order.get("id")
        except Exception as e:
            print(f"Razorpay order creation failed: {e}")
            
    # Fallback to mock ID for local testing if credentials are placeholders
    if not razorpay_order_id:
        razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"

    # 2. Create order record
    order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        total_amount=order_in.total_amount,
        status="pending_payment",
        razorpay_order_id=razorpay_order_id
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Auto-save phone and address to User shipping profile if user is registered
    user = db.query(User).filter(User.email == order_in.customer_email.strip().lower()).first()
    if user:
        user.phone = order_in.customer_phone.strip()
        user.address = order_in.shipping_address.strip()
        db.commit()
    
    # 3. Add order items
    order_items = []
    for item in order_in.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            weight=item.weight,
            price=item.price,
            quantity=item.quantity
        )
        db.add(order_item)
        order_items.append(order_item)
        
    db.commit()
    db.refresh(order)
    
    return order

@router.post("/{order_id}/verify", response_model=OrderResponse)
def verify_order_payment(
    order_id: int,
    payload: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Verifies the payment signature, marks order status as 'processing', and triggers notification emails."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    is_valid = False
    
    # Bypass verification for mock orders
    if payload.razorpay_order_id.startswith("order_mock_"):
        is_valid = True
    else:
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': payload.razorpay_order_id,
                'razorpay_payment_id': payload.razorpay_payment_id,
                'razorpay_signature': payload.razorpay_signature
            })
            is_valid = True
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Signature verification failed: {e}")
            
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
        
    # Update order details and change status to processing
    order.status = "processing"
    order.razorpay_payment_id = payload.razorpay_payment_id
    order.razorpay_signature = payload.razorpay_signature
    db.commit()
    db.refresh(order)
    
    # Dispatch confirmation emails
    background_tasks.add_task(send_order_notifications, order, order.items)
    
    return order

@router.get("/last", response_model=OrderResponse)
def get_last_order(email: str, db: Session = Depends(get_db)):
    """Fetch the most recent order for a customer by email (Public)."""
    order = db.query(Order).filter(Order.customer_email == email).order_by(Order.created_at.desc()).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No previous orders found for this email address."
        )
    return order

@router.get("", response_model=List[OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    """Fetch all orders sorted by newest first (Admin Protected)."""
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderUpdateStatus,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    """Updates the shipment/payment status of an order (Admin Protected)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    valid_statuses = ["pending", "processing", "shipped", "completed", "cancelled"]
    new_status = status_update.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
        
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
