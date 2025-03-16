#!/usr/bin/env python3
import os
import shutil
import json
import sys
from pathlib import Path
import subprocess

def create_deployment_package():
    print("Preparing deployment package...")
    
    # Ensure we're in the project root directory
    project_root = Path.cwd()
    required_dirs = ["frontend", "backend", "smart-contracts"]
    
    for dir_name in required_dirs:
        if not (project_root / dir_name).is_dir():
            print(f"Error: {dir_name} directory not found in {project_root}")
            print("Please run this script from the project root directory.")
            return False
    
    # Create deployment directory
    deploy_dir = project_root / "deployment"
    if deploy_dir.exists():
        print(f"Removing existing deployment directory: {deploy_dir}")
        shutil.rmtree(deploy_dir)
    
    print(f"Creating deployment directory: {deploy_dir}")
    deploy_dir.mkdir()
    
    # Copy frontend files (excluding node_modules)
    print("Copying frontend files...")
    frontend_dir = deploy_dir / "frontend"
    frontend_dir.mkdir()
    
    excluded_frontend_dirs = ["node_modules", "dist", ".vite", "build", "coverage"]
    excluded_frontend_files = [".DS_Store"]
    
    for item in (project_root / "frontend").iterdir():
        if item.is_dir() and item.name in excluded_frontend_dirs:
            continue
        if item.is_file() and item.name in excluded_frontend_files:
            continue
        
        try:
            if item.is_dir():
                print(f"  Copying directory: {item.name}")
                shutil.copytree(item, frontend_dir / item.name)
            else:
                print(f"  Copying file: {item.name}")
                shutil.copy2(item, frontend_dir / item.name)
        except Exception as e:
            print(f"  Error copying {item}: {e}")
    
    # Copy backend files
    print("Copying backend files...")
    backend_dir = deploy_dir / "backend"
    backend_dir.mkdir()
    
    excluded_backend_dirs = ["__pycache__", "env", ".env", ".pytest_cache"]
    excluded_backend_files = [".DS_Store", "*.pyc", "*.pyo", "*.pyd", ".Python", "*.so", "*.dylib"]
    
    for item in (project_root / "backend").iterdir():
        # Skip excluded directories and files
        if item.is_dir() and item.name in excluded_backend_dirs:
            continue
        if item.is_file() and any(item.match(pattern) for pattern in excluded_backend_files):
            continue
        
        try:
            if item.is_dir():
                print(f"  Copying directory: {item.name}")
                # Special handling for routers directory to ensure all files are copied correctly
                if item.name == "routers":
                    routers_dir = backend_dir / "routers"
                    routers_dir.mkdir()
                    
                    for router_file in item.iterdir():
                        if router_file.is_file() and not router_file.name.startswith("__") and not router_file.name.endswith(".pyc"):
                            print(f"    Copying router file: {router_file.name}")
                            shutil.copy2(router_file, routers_dir / router_file.name)
                else:
                    shutil.copytree(item, backend_dir / item.name, ignore=shutil.ignore_patterns(*excluded_backend_files))
            else:
                print(f"  Copying file: {item.name}")
                shutil.copy2(item, backend_dir / item.name)
        except Exception as e:
            print(f"  Error copying {item}: {e}")
    
    # Copy smart contracts (excluding node_modules)
    print("Copying smart contract files...")
    contracts_dir = deploy_dir / "smart-contracts"
    contracts_dir.mkdir()
    
    excluded_contracts_dirs = ["node_modules"]
    excluded_contracts_files = [".DS_Store"]
    
    for item in (project_root / "smart-contracts").iterdir():
        if item.is_dir() and item.name in excluded_contracts_dirs:
            continue
        if item.is_file() and item.name in excluded_contracts_files:
            continue
        
        try:
            if item.is_dir():
                print(f"  Copying directory: {item.name}")
                shutil.copytree(item, contracts_dir / item.name)
            else:
                print(f"  Copying file: {item.name}")
                shutil.copy2(item, contracts_dir / item.name)
        except Exception as e:
            print(f"  Error copying {item}: {e}")
    
    # Copy setup and start scripts
    print("Copying setup and start scripts...")
    for script in ["setup.py", "start.py"]:
        script_path = project_root / script
        if script_path.exists():
            try:
                print(f"  Copying script: {script}")
                shutil.copy2(script_path, deploy_dir / script)
            except Exception as e:
                print(f"  Error copying {script}: {e}")
        else:
            print(f"  Warning: {script} not found, creating a placeholder")
            # Create placeholder scripts if they don't exist
            with open(deploy_dir / script, "w") as f:
                f.write(f"#!/usr/bin/env python3\n# Placeholder {script} file\nprint('Please implement {script}')\n")
    
    # Create README.md with setup instructions
    print("Creating README.md...")
    readme_content = """# Mememonize Trading Platform

A decentralized trading system for digital assets.

## Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MySQL
- Ganache (for local blockchain)

## Quick Start

For a quick setup and start of all services:

\`\`\`bash
# 1. Setup the project (installs all dependencies)
python setup.py

# 2. Configure your database
# Edit backend/.env with your database credentials

# 3. Initialize the database
cd backend
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
python init_db.py
cd ..

# 4. Start all services (Ganache, backend, frontend)
python start.py
\`\`\`

## Project Structure

- `frontend/`: React-based web application
- `backend/`: FastAPI-based REST API
- `smart-contracts/`: Solidity smart contracts for the trading platform

## Development

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Backend

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

### Smart Contracts

\`\`\`bash
cd smart-contracts
npm install
truffle compile
truffle migrate
\`\`\`
"""
    
    with open(deploy_dir / "README.md", "w") as f:
        f.write(readme_content)
    
    print("\nDeployment package created successfully!")
    print(f"Package location: {deploy_dir}")
    return True

if __name__ == "__main__":
    create_deployment_package()

