import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price_250g = Column(Float, nullable=True)  # Price for 250g
    price_500g = Column(Float, nullable=True)  # Price for 500g
    price_1000g = Column(Float, nullable=True) # Price for 1000g (1kg)
    image_url = Column(String, nullable=True)
    tag = Column(String, nullable=True)
    color = Column(String, nullable=True)
    rating = Column(Float, default=4.8)
    reviews = Column(Integer, default=150)
    is_active = Column(Boolean, default=True)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    shipping_address = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, processing, shipped, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True) # nullable if product deleted
    product_name = Column(String, nullable=False)
    weight = Column(String, nullable=False) # e.g. "250g", "500g", "1000g"
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
