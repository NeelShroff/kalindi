import sqlite3
import os

db_path = "database.db"

if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if the column already exists
    cursor.execute("PRAGMA table_info(orders);")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "discount_code" not in columns:
        print("Adding 'discount_code' column to 'orders' table...")
        cursor.execute("ALTER TABLE orders ADD COLUMN discount_code TEXT;")
        conn.commit()
        print("discount_code column added successfully.")
    else:
        print("'discount_code' column already exists in 'orders' table.")
        
    if "payment_method" not in columns:
        print("Adding 'payment_method' column to 'orders' table...")
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'online';")
        conn.commit()
        print("payment_method column added successfully.")
    else:
        print("'payment_method' column already exists in 'orders' table.")
        
except Exception as e:
    print(f"Error during migration: {e}")
    conn.rollback()
finally:
    conn.close()
