"""
Database migration script to update schema for new admin UI
"""
import sys

sys.path.insert(0, '/app')

from app.db import engine
from sqlalchemy import text


def migrate():
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Add pickup_location to customers
            conn.execute(text(
                """
                ALTER TABLE customers
                ADD COLUMN IF NOT EXISTS pickup_location TEXT;
                """
            ))
            # Add new columns to products table
            conn.execute(text("""
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS description TEXT,
                ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE NOT NULL;
            """))
            
            # Conditionally rename columns if they exist
            price_exists = conn.execute(text("""
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='products' AND column_name='price'
            """)).scalar() is not None
            if price_exists:
                conn.execute(text("""
                    ALTER TABLE products 
                    RENAME COLUMN price TO unit_price;
                """))

            cost_exists = conn.execute(text("""
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='products' AND column_name='cost'
            """)).scalar() is not None
            if cost_exists:
                conn.execute(text("""
                    ALTER TABLE products 
                    RENAME COLUMN cost TO cost_price;
                """))
            
            # Make sku NOT NULL (it's already unique)
            conn.execute(text("""
                UPDATE products SET sku = 'SKU-' || id WHERE sku IS NULL;
                ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
            """))
            
            # Add notes column to orders table
            conn.execute(text("""
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS notes TEXT;
            """))

            # Add batch_size to products
            conn.execute(text("""
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS batch_size INTEGER;
            """))

            # Create recurring tables
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS recurring_plans (
                    id SERIAL PRIMARY KEY,
                    customer_id INTEGER NOT NULL REFERENCES customers(id),
                    day_of_week INTEGER NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE,
                    active BOOLEAN NOT NULL DEFAULT TRUE,
                    prepaid_month BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS recurring_plan_items (
                    id SERIAL PRIMARY KEY,
                    plan_id INTEGER NOT NULL REFERENCES recurring_plans(id),
                    product_id INTEGER NOT NULL REFERENCES products(id),
                    quantity INTEGER NOT NULL DEFAULT 1
                );
            """))
            
            # Add subscription field to customers
            conn.execute(text("""
                ALTER TABLE customers 
                ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT FALSE NOT NULL;
            """))
            
            # Add new enum values to PostgreSQL orderstatus type
            conn.execute(text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'encomendado';"))
            conn.execute(text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'pago';"))
            
            # Update existing order statuses to new enum values
            conn.execute(text("""
                UPDATE orders SET status = 'encomendado' WHERE status = 'pending';
                UPDATE orders SET status = 'pago' WHERE status = 'confirmed';
                UPDATE orders SET status = 'delivered' WHERE status = 'dispatched';
            """))
            
            # Also update order_status_history table
            conn.execute(text("""
                UPDATE order_status_history SET status = 'encomendado' WHERE status = 'pending';
                UPDATE order_status_history SET status = 'pago' WHERE status = 'confirmed';
                UPDATE order_status_history SET status = 'delivered' WHERE status = 'dispatched';
            """))
            
            trans.commit()
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
