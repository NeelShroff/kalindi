import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal
from .models import Product
from .routes import auth, products, orders, uploads, agent, history
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kalindi Luxury API", version="1.0.0")

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup directories
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_dir = os.path.join(base_dir, "static")
uploads_dir = os.path.join(static_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount API Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(uploads.router)
app.include_router(agent.router)
app.include_router(history.router)



# Seed default products if database is empty
def seed_products():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            print("Database is empty. Seeding default premium products...")
            default_products = [
                Product(
                    name="Premium California Almonds",
                    description="Handpicked, crispy, and highly nutritious sweet California almonds.",
                    price_250g=279.0,
                    price_500g=499.0,
                    price_1000g=949.0,
                    image_url=None,  # Will fallback to colors/stock on frontend if null
                    tag="Best Seller",
                    color="from-[#D2B48C] to-[#8B6914]",
                    rating=4.9,
                    reviews=2341
                ),
                Product(
                    name="Saffron Pistachios",
                    description="Exquisite pistachios roasted and delicately seasoned with premium Kashmiri saffron.",
                    price_250g=399.0,
                    price_500g=699.0,
                    price_1000g=1299.0,
                    image_url=None,
                    tag="Premium",
                    color="from-[#8B9467] to-[#556B2F]",
                    rating=4.8,
                    reviews=1892
                ),
                Product(
                    name="Royal Cashews W320",
                    description="Whole, white jumbo cashews (W320 grade) known for their rich buttery taste.",
                    price_250g=299.0,
                    price_500g=549.0,
                    price_1000g=999.0,
                    image_url=None,
                    tag="Top Rated",
                    color="from-[#F5DEB3] to-[#D2691E]",
                    rating=4.9,
                    reviews=3102
                ),
                Product(
                    name="Medjool Dates",
                    description="Soft, sweet, and highly luscious Medjool dates imported fresh from the Middle East.",
                    price_250g=289.0,
                    price_500g=449.0,
                    price_1000g=849.0,
                    image_url=None,
                    tag="Natural",
                    color="from-[#8B4513] to-[#3D1F00]",
                    rating=4.7,
                    reviews=987
                ),
                Product(
                    name="Turkish Figs",
                    description="Plump, sun-dried, and premium grade figs imported directly from Izmir, Turkey.",
                    price_250g=379.0,
                    price_500g=699.0,
                    price_1000g=1299.0,
                    image_url=None,
                    tag="Imported",
                    color="from-[#7B3F8C] to-[#3d1a5c]",
                    rating=4.8,
                    reviews=765
                ),
                Product(
                    name="Jumbo Raisins",
                    description="Sweet and juicy green jumbo raisins naturally dried to preserve goodness.",
                    price_250g=169.0,
                    price_500g=299.0,
                    price_1000g=549.0,
                    image_url=None,
                    tag="Value Pack",
                    color="from-[#722F37] to-[#3D0C11]",
                    rating=4.6,
                    reviews=1543
                ),
                Product(
                    name="Fox Nuts (Makhana)",
                    description="Healthy, roasted, popped fox nuts perfect for low-calorie weight loss snacking.",
                    price_250g=249.0,
                    price_500g=449.0,
                    price_1000g=None, # Weight options can be omitted
                    image_url=None,
                    tag="Healthy",
                    color="from-[#F5F5DC] to-[#D2B48C]",
                    rating=4.8,
                    reviews=2104
                ),
                Product(
                    name="Kalindi Assorted Gift Box",
                    description="A luxury assortments collection of Almonds, Cashews, Pistachios, and Figs.",
                    price_250g=None,
                    price_500g=None,
                    price_1000g=1299.0,
                    image_url=None,
                    tag="Gift Ready",
                    color="from-[#e91e8c] to-[#3d1a5c]",
                    rating=5.0,
                    reviews=542
                )
            ]
            db.add_all(default_products)
            db.commit()
            print("Successfully seeded database with 8 products.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

seed_products()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the Kalindi Luxury Dry Fruits & Wellness API"}
