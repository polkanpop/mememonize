from web3 import Web3
import json
import os

# Connect to Ganache
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Load contract ABI and address
def load_contract():
    try:
        # Path to contract ABI
        contract_path = os.path.join(os.path.dirname(__file__), '../smart-contracts/build/contracts/MememonizeEscrow.json')
        
        with open(contract_path, 'r') as file:
            contract_json = json.load(file)
            contract_abi = contract_json['abi']
            
            # Get the network ID (usually 5777 for Ganache)
            network_id = list(contract_json['networks'].keys())[0]
            contract_address = contract_json['networks'][network_id]['address']
            
            # Create contract instance
            contract = w3.eth.contract(address=contract_address, abi=contract_abi)
            return contract
    except Exception as e:
        print(f"Error loading contract: {e}")
        return None

# List an asset on the blockchain
def list_asset(name, price, from_address):
    try:
        contract = load_contract()
        if not contract:
            return None
        
        # Convert price to wei
        price_wei = w3.to_wei(price, 'ether')
        
        # Estimate gas
        gas_estimate = contract.functions.listAsset(name, price_wei).estimate_gas({'from': from_address})
        
        # Build transaction
        txn = contract.functions.listAsset(name, price_wei).build_transaction({
            'from': from_address,
            'gas': gas_estimate,
            'nonce': w3.eth.get_transaction_count(from_address),
        })
        
        # In a real app, the user would sign this transaction with their private key
        # For demo purposes, we'll use a Ganache account with known private key
        private_key = '0x' + 'a' * 64  # Replace with actual private key in production
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
        
        # Get asset ID from event logs
        asset_id = None
        for log in txn_receipt['logs']:
            event = contract.events.AssetListed().process_log(log)
            if event:
                asset_id = event['args']['assetId']
                break
        
        return {
            'transaction_hash': txn_hash.hex(),
            'asset_id': asset_id,
        }
    except Exception as e:
        print(f"Error listing asset: {e}")
        return None

# Purchase an asset
def purchase_asset(asset_id, price, buyer_address):
    try:
        contract = load_contract()
        if not contract:
            return None
        
        # Convert price to wei
        price_wei = w3.to_wei(price, 'ether')
        
        # Estimate gas
        gas_estimate = contract.functions.purchaseAsset(asset_id).estimate_gas({
            'from': buyer_address,
            'value': price_wei
        })
        
        # Build transaction
        txn = contract.functions.purchaseAsset(asset_id).build_transaction({
            'from': buyer_address,
            'gas': gas_estimate,
            'value': price_wei,
            'nonce': w3.eth.get_transaction_count(buyer_address),
        })
        
        # In a real app, the user would sign this transaction with their private key
        # For demo purposes, we'll use a Ganache account with known private key
        private_key = '0x' + 'b' * 64  # Replace with actual private key in production
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
        
        # Get transaction ID from event logs
        transaction_id = None
        for log in txn_receipt['logs']:
            event = contract.events.AssetPurchased().process_log(log)
            if event:
                transaction_id = event['args']['transactionId']
                break
        
        return {
            'transaction_hash': txn_hash.hex(),
            'transaction_id': transaction_id,
        }
    except Exception as e:
        print(f"Error purchasing asset: {e}")
        return None

# Complete a transaction
def complete_transaction(transaction_id, buyer_address):
    try:
        contract = load_contract()
        if not contract:
            return None
        
        # Estimate gas
        gas_estimate = contract.functions.completeTransaction(transaction_id).estimate_gas({
            'from': buyer_address
        })
        
        # Build transaction
        txn = contract.functions.completeTransaction(transaction_id).build_transaction({
            'from': buyer_address,
            'gas': gas_estimate,
            'nonce': w3.eth.get_transaction_count(buyer_address),
        })
        
        # In a real app, the user would sign this transaction with their private key
        # For demo purposes, we'll use a Ganache account with known private key
        private_key = '0x' + 'b' * 64  # Replace with actual private key in production
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
        
        return {
            'transaction_hash': txn_hash.hex(),
            'status': 'completed',
        }
    except Exception as e:
        print(f"Error completing transaction: {e}")
        return None

# Cancel a transaction
def cancel_transaction(transaction_id, address):
    try:
        contract = load_contract()
        if not contract:
            return None
        
        # Estimate gas
        gas_estimate = contract.functions.cancelTransaction(transaction_id).estimate_gas({
            'from': address
        })
        
        # Build transaction
        txn = contract.functions.cancelTransaction(transaction_id).build_transaction({
            'from': address,
            'gas': gas_estimate,
            'nonce': w3.eth.get_transaction_count(address),
        })
        
        # In a real app, the user would sign this transaction with their private key
        # For demo purposes, we'll use a Ganache account with known private key
        private_key = '0x' + 'c' * 64  # Replace with actual private key in production
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
        
        return {
            'transaction_hash': txn_hash.hex(),
            'status': 'cancelled',
        }
    except Exception as e:
        print(f"Error cancelling transaction: {e}")
        return None

