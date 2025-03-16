from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

from database import get_db, engine, Base
import models
import schemas
from routers import assets, transactions, search, contract

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mememonize Trading API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(contract.router, prefix="/api/contract-address", tags=["contract"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Mememonize Trading API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

