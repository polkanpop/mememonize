#!/usr/bin/env python3
import os
import subprocess
import sys
import argparse
import shutil
from pathlib import Path
import datetime

def run_command(command, cwd=None, shell=True):
    """Run a command and return the result."""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=shell, 
            check=True, 
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        print(f"Error output: {e.stderr}")
        return False, e.stderr

def create_deployment_package():
    """Create a deployment package using prepare_deployment.py"""
    print("Creating deployment package...")
    success, output = run_command("python prepare_deployment.py")
    if not success:
        print("Failed to create deployment package")
        return False
    return True

def deploy_to_server(server, username, package_path, remote_dir):
    """Deploy the package to a remote server using SCP and SSH"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    remote_path = f"{remote_dir}/mememonize-trading-{timestamp}"
    
    print(f"Deploying to {username}@{server}:{remote_path}...")
    
    # Create remote directory
    ssh_mkdir_cmd = f"ssh {username}@{server} 'mkdir -p {remote_path}'"
    success, _ = run_command(ssh_mkdir_cmd)
    if not success:
        print("Failed to create remote directory")
        return False
    
    # Copy package to remote server
    scp_cmd = f"scp -r {package_path}/* {username}@{server}:{remote_path}/"
    success, _ = run_command(scp_cmd)
    if not success:
        print("Failed to copy files to remote server")
        return False
    
    # Run setup script on remote server
    ssh_setup_cmd = f"ssh {username}@{server} 'cd {remote_path} && python setup.py'"
    success, _ = run_command(ssh_setup_cmd)
    if not success:
        print("Failed to run setup script on remote server")
        return False
    
    print(f"Deployment successful! Application deployed to {remote_path}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Deploy Mememonize Trading Platform")
    parser.add_argument("--prepare-only", action="store_true", help="Only prepare the deployment package without deploying")
    parser.add_argument("--server", help="Server hostname or IP address")
    parser.add_argument("--username", help="SSH username")
    parser.add_argument("--remote-dir", default="/var/www", help="Remote directory to deploy to")
    
    args = parser.parse_args()
    
    # Create deployment package
    if not create_deployment_package():
        sys.exit(1)
    
    # If prepare-only flag is set, exit after preparing the package
    if args.prepare_only:
        print("Deployment package prepared successfully. Exiting without deploying.")
        sys.exit(0)
    
    # Check if server and username are provided
    if not args.server or not args.username:
        print("Server hostname and username are required for deployment")
        print("Use --prepare-only flag if you only want to prepare the package")
        sys.exit(1)
    
    # Deploy to server
    package_path = Path.cwd() / "deployment"
    if not deploy_to_server(args.server, args.username, package_path, args.remote_dir):
        sys.exit(1)
    
    print("Deployment completed successfully!")

if __name__ == "__main__":
    main()

