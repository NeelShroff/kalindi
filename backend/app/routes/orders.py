import razorpay
import uuid
import httpx
import json
import logging
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Order, OrderItem, Product, User
from ..schemas import OrderCreate, OrderResponse, OrderUpdateStatus
from ..auth import get_current_admin, get_current_user
from ..services.email import send_order_notifications
from ..config import settings

logger = logging.getLogger(__name__)

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class AddressValidationRequest(BaseModel):
    address: str

class AddressValidationResponse(BaseModel):
    is_valid: bool
    missing_parts: List[str]
    suggested_address: str

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("/validate-address", response_model=AddressValidationResponse)
async def validate_address(request: AddressValidationRequest):
    """Validates the structure of the address using Groq API."""
    address_str = request.address.strip()
    if not address_str:
        return AddressValidationResponse(
            is_valid=False,
            missing_parts=["address text is empty"],
            suggested_address=""
        )
        
    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY not configured. Skipping LLM address validation.")
        # Local heuristic fallback
        has_number = any(char.isdigit() for char in address_str)
        words = address_str.split()
        missing = []
        if not has_number:
            missing.append("house/flat number or building detail")
        if len(words) < 3:
            missing.append("more detailed street/area information")
            
        return AddressValidationResponse(
            is_valid=len(missing) == 0,
            missing_parts=missing,
            suggested_address=address_str
        )

    # System prompt for address evaluation
    system_prompt = (
        "You are an address validation assistant for a luxury Indian brand.\n"
        "Analyze the given Indian shipping address and check if it is complete and deliverable.\n"
        "A deliverable Indian address MUST contain:\n"
        "1. House number, flat number, room number, shop number, or a specific building/society name.\n"
        "2. A street name, road name, lane, sector, locality, or area.\n"
        "3. A valid 6-digit Indian PIN Code.\n"
        "4. City and State (these can be inferred if they match the PIN code, but the address string should contain enough description).\n\n"
        "Output your response strictly as a JSON object with these keys:\n"
        "- \"is_valid\": boolean (true if all components are present and the address is deliverable, false otherwise)\n"
        "- \"missing_parts\": list of strings (e.g. [\"house number\", \"building name\", \"street/area\"] describing what is missing if is_valid is false, otherwise empty)\n"
        "- \"suggested_address\": string (standardized, cleaned-up version of the address with proper capitalization, commas, and spacing. If is_valid is false, try your best to clean up what is there).\n"
        "Do not include any explanation or markdown formatting in your response. Output raw JSON only."
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-8b-8192",  # Fast and extremely cheap
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Address: {address_str}"}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 512,
                    "response_format": {"type": "json_object"}
                }
            )
            
            if response.status_code == 200:
                result_json = response.json()
                reply = result_json["choices"][0]["message"]["content"]
                parsed_reply = json.loads(reply.strip())
                return AddressValidationResponse(
                    is_valid=parsed_reply.get("is_valid", False),
                    missing_parts=parsed_reply.get("missing_parts", []),
                    suggested_address=parsed_reply.get("suggested_address", address_str)
                )
            else:
                logger.error(f"Groq API address validation error: {response.text}")
                has_number = any(char.isdigit() for char in address_str)
                missing = []
                if not has_number:
                    missing.append("house/flat number or building detail")
                return AddressValidationResponse(
                    is_valid=len(missing) == 0,
                    missing_parts=missing,
                    suggested_address=address_str
                )
    except Exception as e:
        logger.error(f"Exception during Groq address validation: {e}")
        has_number = any(char.isdigit() for char in address_str)
        missing = []
        if not has_number:
            missing.append("house/flat number or building detail")
        return AddressValidationResponse(
            is_valid=len(missing) == 0,
            missing_parts=missing,
            suggested_address=address_str
        )

# ─── Constants ────────────────────────────────────────────────────────────────
WEIGHT_FIELD_MAP = {
    "100g": "price_100g",
    "100 g": "price_100g",
    "250g": "price_250g",
    "500g": "price_500g",
    "1000g": "price_1000g",
    "1kg": "price_1000g",
    "1 kg": "price_1000g",
}
SHIPPING_THRESHOLD = 2000.0


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Submits a customer order.
    
    SECURITY: All prices are recalculated server-side from the database.
    The client-supplied `total_amount` and per-item `price` values are IGNORED.
    """
    # ── 1. SERVER-SIDE PRICE VALIDATION ──────────────────────────────────────
    # Never trust client-supplied prices. Look up every product in the DB.
    subtotal = 0.0
    validated_items: list[tuple] = []  # (item, db_price, product_name)

    for item in order_in.items:
        if item.product_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="product_id is required for all order items."
            )

        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product ID {item.product_id} is not found or is unavailable."
            )

        field = WEIGHT_FIELD_MAP.get(item.weight)
        if not field:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid weight '{item.weight}'. Allowed values: 100g, 250g, 500g, 1000g, 1kg."
            )

        db_price = getattr(product, field, None)
        if db_price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weight '{item.weight}' is not available for '{product.name}'."
            )

        subtotal += db_price * item.quantity
        validated_items.append((item, db_price, product.name))

    # ── 1.5. SERVER-SIDE DISCOUNT VALIDATION & CALCULATION ────────────────────
    discount_applied = 0.0
    applied_discount_code = None
    if order_in.discount_code and order_in.discount_code.strip():
        code = order_in.discount_code.strip().upper()
        if code == "FIRST7":
            if subtotal < 1500.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The promo code FIRST7 requires a minimum order value of ₹1,500."
                )
            
            # Check if they have previous successful/processing orders
            prev_orders = db.query(Order).filter(
                Order.customer_email == order_in.customer_email.strip().lower(),
                Order.status.in_(["processing", "shipped", "completed"])
            ).count()
            if prev_orders > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The promo code FIRST7 is only valid for your first order."
                )
            
            discount_applied = round(subtotal * 0.07, 2)
            subtotal -= discount_applied
            applied_discount_code = "FIRST7"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Promo code '{code}' is invalid."
            )

    # ── 2. SERVER-SIDE SHIPPING CALCULATION ──────────────────────────────────
    # Calculate total weight of order in kg
    total_weight_kg = 0.0
    for item, _, _ in validated_items:
        item_weight = 0.0
        if item.weight == "250g":
            item_weight = 0.25
        elif item.weight == "500g":
            item_weight = 0.5
        elif item.weight in ["1000g", "1kg", "1 kg", "1000 g"]:
            item_weight = 1.0
        total_weight_kg += item_weight * item.quantity

    # Determine weight-based shipping fee
    if total_weight_kg <= 1.0:
        shipping_fee = 50.0
    elif total_weight_kg <= 2.0:
        shipping_fee = 120.0
    elif total_weight_kg <= 3.0:
        shipping_fee = 150.0
    else:
        shipping_fee = 180.0

    server_total = subtotal
    if server_total < SHIPPING_THRESHOLD:
        server_total += shipping_fee

    server_total = round(server_total, 2)

    # ── 3. CREATE RAZORPAY ORDER USING SERVER-CALCULATED TOTAL (OR BYPASS FOR COD) ──
    razorpay_order_id = None
    order_status = "pending_payment"
    
    if order_in.payment_method == "cod":
        order_status = "processing"
    else:
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_ID != "rzp_test_placeholder_key":
            try:
                amount_in_paise = int(server_total * 100)
                razorpay_order = razorpay_client.order.create({
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "payment_capture": 1
                })
                razorpay_order_id = razorpay_order.get("id")
            except Exception as e:
                print(f"Razorpay order creation failed: {e}")

        # Mock mode: only allowed in development
        if not razorpay_order_id:
            if settings.APP_ENV != "development":
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Payment gateway is currently unavailable. Please try again later."
                )
            razorpay_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"

    # ── 4. PERSIST ORDER WITH SERVER-CALCULATED TOTAL ────────────────────────
    order = Order(
        customer_name=order_in.customer_name,
        customer_email=order_in.customer_email,
        customer_phone=order_in.customer_phone,
        shipping_address=order_in.shipping_address,
        total_amount=server_total,          # ← Server-calculated; client value ignored
        discount_code=applied_discount_code,
        payment_method=order_in.payment_method or "online",
        status=order_status,
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

    # ── 5. PERSIST ORDER ITEMS WITH SERVER PRICES ─────────────────────────────
    for item, db_price, product_name in validated_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=product_name,      # ← From DB, not client
            weight=item.weight,
            price=db_price,              # ← From DB, not client
            quantity=item.quantity
        )
        db.add(order_item)
    db.commit()
    db.refresh(order)
    
    # ── 6. TRIGGER NOTIFICATIONS FOR COD ORDERS DIRECTLY ──────────────────────
    if order.payment_method == "cod":
        background_tasks.add_task(send_order_notifications, order, order.items)
    
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
    
    # Bypass verification for mock orders (development only)
    if payload.razorpay_order_id.startswith("order_mock_"):
        if settings.APP_ENV == "production":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mock payment IDs are not accepted in production."
            )
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
