#!/usr/bin/env python3
import os
import shutil
import json
from pathlib import Path
import subprocess

def create_deployment_package():
    print("Preparing deployment package...")
    
    # Create deployment directory
    deploy_dir = Path("deployment")
    if deploy_dir.exists():
        shutil.rmtree(deploy_dir)
    deploy_dir.mkdir()
    
    # Copy frontend files (excluding node_modules)
    frontend_dir = deploy_dir / "frontend"
    frontend_dir.mkdir()
    
    # Copy frontend files
    for item in Path("frontend").iterdir():
        if item.name != "node_modules" and item.name != "dist" and item.name != ".vite":
            if item.is_dir():
                shutil.copytree(item, frontend_dir / item.name)
            else:
                shutil.copy2(item, frontend_dir / item.name)
    
    # Copy backend files
    backend_dir = deploy_dir / "backend"
    backend_dir.mkdir()
    
    for item in Path("backend").iterdir():
        if item.name != "__pycache__" and item.name != "venv" and not item.name.endswith(".pyc"):
            if item.is_dir():
                shutil.copytree(item, backend_dir / item.name)
            else:
                shutil.copy2(item, backend_dir / item.name)
    
    # Copy smart contracts (excluding node_modules)
    contracts_dir = deploy_dir / "smart-contracts"
    contracts_dir.mkdir()
    
    for item in Path("smart-contracts").iterdir():
        if item.name != "node_modules":
            if item.is_dir():
                shutil.copytree(item, contracts_dir / item.name)
            else:
                shutil.copy2(item, contracts_dir / item.name)
    
    # Create README.md with setup instructions
    with open(deploy_dir / "README.md", "w") as f:
        f.write("""# Mememonize Trading Platform

A decentralized trading system for digital assets.

## Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MySQL
- Ganache (for local blockchain)

## Setup Instructions

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE mememonize;
CREATE USER 'mememonize_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON mememonize.* TO 'mememonize_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update .env file with your database credentials
cd backend
cp .env.example .env
# Edit .env with your database credentials



        """)