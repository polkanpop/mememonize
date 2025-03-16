# Mememonize Trading Platform

A decentralized trading system for digital assets.

## Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MySQL
- Ganache (for local blockchain)

## Quick Start

For a quick setup and start of all services:

```bash
# 1. Setup the project (installs all dependencies)
python setup.py

# 2. Configure your database
# Edit backend/.env with your database credentials

# 3. Initialize the database
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python init_db.py
cd ..

# 4. Start all services (Ganache, backend, frontend)
python start.py

