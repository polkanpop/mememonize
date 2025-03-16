from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models
import os
from dotenv import load_dotenv
import random

load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/mememonize")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Sample data
def init_db():
    db = SessionLocal()
    
    # Check if we already have data
    existing_assets = db.query(models.Asset).count()
    if existing_assets > 0:
        print("Database already initialized with sample data.")
        return
    
    # Sample categories
    categories = ["Art", "Collectibles", "Music", "Gaming", "Virtual Real Estate"]
    
    # Sample users
    users = [
        {"wallet_address": "0x1234567890abcdef1234567890abcdef12345678", "username": "alice", "email": "alice@example.com"},
        {"wallet_address": "0xabcdef1234567890abcdef1234567890abcdef12", "username": "bob", "email": "bob@example.com"},
        {"wallet_address": "0x7890abcdef1234567890abcdef1234567890abcd", "username": "charlie", "email": "charlie@example.com"},
    ]
    
    for user_data in users:
        user = models.User(**user_data)
        db.add(user)
    
    db.commit()
    
    # Get user IDs
    db_users = db.query(models.User).all()
    user_ids = [user.id for user in db_users]
    
    # Sample assets
    assets = [
        {
            "name": "Cosmic Horizon",
            "description": "A digital artwork depicting a futuristic space landscape with vibrant colors.",
            "price": 0.5,
            "image_url": "https://via.placeholder.com/500x500?text=Cosmic+Horizon",
            "category": "Art",
            "token_id": f"0x{random.randint(10000, 99999)}",
            "owner_address": users[0]["wallet_address"],
        },
        {
            "name": "Pixel Panda #42",
            "description": "A rare collectible pixel art panda, part of the Pixel Panda collection.",
            "price": 0.25,
            "image_url": "https://via.placeholder.com/500x500?text=Pixel+Panda",
            "category": "Collectibles",
            "token_id": f"0x{random.randint(10000, 99999)}",
            "owner_address": users[1]["wallet_address"],
        },
        {
            "name": "Ethereal Melody",
            "description": "An exclusive music track with rights to use in personal projects.",
            "price": 0.15,
            "image_url": "https://via.placeholder.com/500x500?text=Ethereal+Melody",
            "category": "Music",
            "token_id": f"0x{random.randint(10000, 99999)}",
            "owner_address": users[2]["wallet_address"],
        },
        {
            "name": "Dragon Sword",
            "description": "A legendary sword for the Mythic Realms game, granting +50 attack power.",
            "price": 0.35,
            "image_url": "https://via.placeholder.com/500x500?text=Dragon+Sword",
            "category": "Gaming",
            "token_id": f"0x{random.randint(10000, 99999)}",
            "owner_address": users[0]["wallet_address"],
        },
        {
            "name": "Cyber City Apartment",
            "description": "A luxurious virtual apartment in the heart of Cyber City.",
            "price": 1.2,
            "image_url": "https://via.placeholder.com/500x500?text=Cyber+City+Apartment",
            "category": "Virtual Real Estate",
            "token_id": f"0x{random.randint(10000, 99999)}",
            "owner_address": users[1]["wallet_address"],
        },
    ]
    
    for asset_data in assets:
        asset = models.Asset(**asset_data)
        db.add(asset)
    
    db.commit()
    
    # Get asset IDs
    db_assets = db.query(models.Asset).all()
    
    # Sample transactions
    transactions = [
        {
            "asset_id": db_assets[0].id,
            "buyer_id": user_ids[1],
            "seller_id": user_ids[0],
            "price": db_assets[0].price,
            "transaction_hash": f"0x{random.randint(100000, 999999)}",
            "status": "completed",
        },
        {
            "asset_id": db_assets[2].id,
            "buyer_id": user_ids[0],
            "seller_id": user_ids[2],
            "price": db_assets[2].price,
            "transaction_hash": f"0x{random.randint(100000, 999999)}",
            "status": "completed",
        },
    ]
    
    for transaction_data in transactions:
        transaction = models.Transaction(**transaction_data)
        db.add(transaction)
    
    db.commit()
    
    print("Database initialized with sample data.")

if __name__ == "__main__":
    init_db()

