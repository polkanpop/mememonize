from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import sys

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://admin_mememonize:1234@localhost/mememonize")

def fix_database():
    """
    Fix database issues:
    1. Add blockchain_transaction_id column to transactions table if it doesn't exist
    2. Check for other potential issues
    """
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Create inspector
        inspector = inspect(engine)
        
        # Check if transactions table exists
        if not inspector.has_table("transactions"):
            print("Error: transactions table does not exist!")
            return False
        
        # Get columns in transactions table
        columns = [col["name"] for col in inspector.get_columns("transactions")]
        
        # Check if blockchain_transaction_id column exists
        if "blockchain_transaction_id" not in columns:
            print("Adding blockchain_transaction_id column to transactions table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN blockchain_transaction_id VARCHAR(100)"))
                conn.commit()
            print("Column added successfully!")
        else:
            print("blockchain_transaction_id column already exists.")
        
        # Check for other potential issues
        print("Checking for other potential issues...")
        
        # Test a simple query to make sure the table is accessible
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM transactions"))
            count = result.scalar()
            print(f"Found {count} transactions in the database.")
        
        print("Database check completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error fixing database: {e}")
        return False

if __name__ == "__main__":
    success = fix_database()
    sys.exit(0 if success else 1)

