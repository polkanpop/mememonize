#!/usr/bin/env python3
import os
import subprocess
import sys
from pathlib import Path

def run_command(command, cwd=None):
    print(f"Running: {command}")
    try:
        subprocess.run(command, shell=True, check=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        return False

def setup_project():
    print("Setting up Mememonize Trading Platform...")
    
    # Check if Python is installed
    if not run_command("python --version"):
        print("Python is not installed. Please install Python 3.8 or higher.")
        return False
    
    # Check if Node.js is installed
    if not run_command("node --version"):
        print("Node.js is not installed. Please install Node.js 14 or higher.")
        return False
    
    # Setup backend
    print("\n=== Setting up Backend ===")
    backend_dir = Path("backend")
    
    # Create virtual environment
    run_command("python -m venv venv", cwd=backend_dir)
    
    # Activate virtual environment and install dependencies
    if sys.platform == "win32":
        run_command("venv\\Scripts\\activate && pip install -r requirements.txt", cwd=backend_dir)
    else:
        run_command("source venv/bin/activate && pip install -r requirements.txt", cwd=backend_dir)
    
    # Setup frontend
    print("\n=== Setting up Frontend ===")
    frontend_dir = Path("frontend")
    run_command("npm install", cwd=frontend_dir)
    
    # Setup smart contracts
    print("\n=== Setting up Smart Contracts ===")
    contracts_dir = Path("smart-contracts")
    run_command("npm install", cwd=contracts_dir)
    
    print("\n=== Setup Complete ===")
    print("""
Next steps:
1. Configure your database in backend/.env
2. Initialize the database: cd backend && python init_db.py
3. Start Ganache: ganache-cli
4. Deploy smart contracts: cd smart-contracts && truffle migrate
5. Start backend: cd backend && uvicorn main:app --reload
6. Start frontend: cd frontend && npm run dev
7. Access the application at http://localhost:5173
""")
    
    return True

if __name__ == "__main__":
    setup_project()

