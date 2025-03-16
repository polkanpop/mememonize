from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Transaction])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
    return transactions

@router.get("/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.get("/user/{user_id}", response_model=List[schemas.Transaction])
def get_user_transactions(user_id: int, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(
        (models.Transaction.buyer_id == user_id) | (models.Transaction.seller_id == user_id)
    ).all()
    return transactions

@router.post("/", response_model=schemas.Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    # Check if asset exists and is available
    asset = db.query(models.Asset).filter(models.Asset.id == transaction.asset_id).first()
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not asset.is_available:
        raise HTTPException(status_code=400, detail="Asset is not available for purchase")
    
    # Create transaction
    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    
    # Update asset availability
    asset.is_available = False
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.put("/{transaction_id}/status", response_model=schemas.Transaction)
def update_transaction_status(transaction_id: int, status: str, db: Session = Depends(get_db)):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if status not in ["pending", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    transaction.status = status
    
    # If cancelled, make asset available again
    if status == "cancelled":
        asset = db.query(models.Asset).filter(models.Asset.id == transaction.asset_id).first()
        if asset:
            asset.is_available = True
    
    db.commit()
    db.refresh(transaction)
    return transaction

