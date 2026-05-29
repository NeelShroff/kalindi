from app.database import SessionLocal
from app.models import Order, OrderItem, User
import datetime

db = SessionLocal()
try:
    # Ensure connoisseur user exists
    user = db.query(User).filter(User.email == "connoisseur@kalindi.com").first()
    if not user:
        user = User(
            email="connoisseur@kalindi.com",
            name="Guest Connoisseur",
            picture="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
            google_id="demo-google-id-connoisseur@kalindi.com"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("Demo User created.")

    # Check if this user already has an order
    order = db.query(Order).filter(Order.customer_email == "connoisseur@kalindi.com").first()
    if not order:
        order = Order(
            customer_name="Guest Connoisseur",
            customer_email="connoisseur@kalindi.com",
            customer_phone="9876543210",
            shipping_address="123 Luxury Avenue, Golden Heights, Suite 7A",
            total_amount=978.0,
            status="pending",
            created_at=datetime.datetime.utcnow()
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # Add items: Saffron Pistachios (500g, 699) and Premium California Almonds (250g, 279)
        item1 = OrderItem(
            order_id=order.id,
            product_id=2,
            product_name="Saffron Pistachios",
            weight="500g",
            price=699.0,
            quantity=1
        )
        item2 = OrderItem(
            order_id=order.id,
            product_id=1,
            product_name="Premium California Almonds",
            weight="250g",
            price=279.0,
            quantity=1
        )
        db.add(item1)
        db.add(item2)
        db.commit()
        print("Demo order seeded successfully!")
    else:
        print("Demo order already exists.")
finally:
    db.close()
