from app.database import SessionLocal
from app.models import Product

db = SessionLocal()
try:
    products = db.query(Product).all()
    print(f"Total products: {len(products)}")
    for p in products:
        print(f"ID: {p.id} | Name: {p.name} | Image URL: {p.image_url}")
finally:
    db.close()
