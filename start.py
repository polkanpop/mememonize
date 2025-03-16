#!/usr/bin/env python3
import os
import subprocess
import sys
import time
import threading
from pathlib import Path

def run_command(command, cwd=None, background=False):
    print(f"Running: {command}")
    if background:
        if sys.platform == "win32":
            return subprocess.Popen(command, shell=True, cwd=cwd)
        else:
            return subprocess.Popen(command, shell=True, cwd=cwd)
    else:
        try:
            subprocess.run(command, shell=True, check=True, cwd=cwd)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error executing command: {e}")
            return False

def start_services():
    print("Starting Mememonize Trading Platform...")
    
    # Start Ganache
    print("\n=== Starting Ganache ===")
    ganache_process = run_command("ganache-cli", background=True)
    
    # Wait for Ganache to start
    print("Waiting for Ganache to start...")
    time.sleep(5)
    
    # Deploy smart contracts
    print("\n=== Deploying Smart Contracts ===")
    contracts_dir = Path("smart-contracts")
    run_command("truffle migrate --reset", cwd=contracts_dir)
    
    # Start backend
    print("\n=== Starting Backend ===")
    backend_dir = Path("backend")
    if sys.platform == "win32":
        backend_process = run_command("venv\\Scripts\\activate && uvicorn main:app --reload", cwd=backend_dir, background=True)
    else:
        backend_process = run_command("source venv/bin/activate && uvicorn main:app --reload", cwd=backend_dir, background=True)
    
    # Wait for backend to start
    print("Waiting for backend to start...")
    time.sleep(5)
    
    # Start frontend
    print("\n=== Starting Frontend ===")
    frontend_dir = Path("frontend")
    frontend_process = run_command("npm run dev", cwd=frontend_dir, background=True)
    
    print("\n=== All Services Started ===")
    print("Access the application at http://localhost:5173")
    print("Press Ctrl+C to stop all services")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping all services...")
        if ganache_process:
            ganache_process.terminate()
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("All services stopped")

if __name__ == "__main__":
    start_services()

