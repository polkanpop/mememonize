from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/mememonize")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Add the blockchain_transaction_id column to the transactions table
def migrate_transactions_table():
    try:
        # Create a connection
        conn = engine.connect()
        
        # Check if the column already exists
        result = conn.execute("SHOW COLUMNS FROM transactions LIKE 'blockchain_transaction_id'")
        column_exists = result.fetchone() is not None
        
        if not column_exists:
            # Add the column if it doesn't exist
            conn.execute("ALTER TABLE transactions ADD COLUMN blockchain_transaction_id VARCHAR(100)")
            print("Added blockchain_transaction_id column to transactions table")
        else:
            print("blockchain_transaction_id column already exists")
            
        conn.close()
        return True
    except Exception as e:
        print(f"Error migrating transactions table: {e}")
        return False

if __name__ == "__main__":
    migrate_transactions_table()

