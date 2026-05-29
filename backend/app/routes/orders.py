from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Order, OrderItem, Product
from ..schemas import OrderCreate, OrderResponse, OrderUpdateStatus
from ..auth import get_current_admin
from ..services.email import send_order_notifications

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Submits a customer order, records items in the DB, and dispatches confirmation emails (Public)."""
    # 1. Create order record
    order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        total_amount=order_in.total_amount,
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # 2. Add order items
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
    
    # Refresh to load relationships
    db.refresh(order)
    
    # 3. Schedule email notification background task
    background_tasks.add_task(send_order_notifications, order, order_items)
    
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
