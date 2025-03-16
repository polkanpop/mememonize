import Web3 from 'web3';
import MememonizeEscrowABI from '../contracts/MememonizeEscrow.json';

let web3;
let escrowContract;

// Initialize Web3
export const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      
      // Get the network ID
      const networkId = await web3.eth.net.getId();
      
      // Try to get contract address from backend first
      try {
        const response = await fetch('/api/contract-address');
        const data = await response.json();
        
        if (data.address) {
          escrowContract = new web3.eth.Contract(
            MememonizeEscrowABI.abi,
            data.address
          );
          return { web3, escrowContract };
        }
      } catch (error) {
        console.warn('Could not fetch contract address from backend, falling back to local ABI');
      }
      
      // Fallback to ABI networks if backend fails
      const deployedNetwork = MememonizeEscrowABI.networks[networkId];
      
      if (deployedNetwork) {
        escrowContract = new web3.eth.Contract(
          MememonizeEscrowABI.abi,
          deployedNetwork.address
        );
        
        return { web3, escrowContract };
      } else {
        console.error('Contract not deployed on the current network');
        return { web3, escrowContract: null };
      }
    } catch (error) {
      console.error('User denied account access', error);
      return { web3: null, escrowContract: null };
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    web3 = new Web3(window.web3.currentProvider);
    return { web3, escrowContract: null };
  } else {
    // Fallback to local provider
    const provider = new Web3.providers.HttpProvider('http://localhost:8545');
    web3 = new Web3(provider);
    return { web3, escrowContract: null };
  }
};

// Get current account
export const getCurrentAccount = async () => {
  if (!web3) {
    console.log("web3 not initialized, initializing now...");
    await initWeb3();
  }
  if (!web3) {
    throw new Error("Failed to initialize web3");
  }
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
};

// List an asset
export const listAsset = async (name, price) => {
  if (!escrowContract) await initWeb3();
  const account = await getCurrentAccount();
  
  const priceWei = web3.utils.toWei(price.toString(), 'ether');
  
  return escrowContract.methods.listAsset(name, priceWei)
    .send({ from: account });
};

// Purchase an asset
export const purchaseAsset = async (assetId, price) => {
  if (!escrowContract) await initWeb3();
  const account = await getCurrentAccount();
  
  const priceWei = web3.utils.toWei(price.toString(), 'ether');
  
  return escrowContract.methods.purchaseAsset(assetId)
    .send({ from: account, value: priceWei });
};

// Complete a transaction
export const completeTransaction = async (transactionId) => {
  if (!escrowContract) await initWeb3();
  const account = await getCurrentAccount();
  
  return escrowContract.methods.completeTransaction(transactionId)
    .send({ from: account });
};

// Cancel a transaction
export const cancelTransaction = async (transactionId) => {
  if (!escrowContract) await initWeb3();
  const account = await getCurrentAccount();
  
  return escrowContract.methods.cancelTransaction(transactionId)
    .send({ from: account });
};

export default {
  initWeb3,
  getCurrentAccount,
  listAsset,
  purchaseAsset,
  completeTransaction,
  cancelTransaction,
};