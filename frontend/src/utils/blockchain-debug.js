import Web3 from "web3"

// Function to check if a contract exists at the given address
export const checkContractExists = async (contractAddress, web3Instance = null) => {
  try {
    const web3 = web3Instance || new Web3(window.ethereum || "http://localhost:8545")
    const code = await web3.eth.getCode(contractAddress)

    // If there's no code at the address, it's not a contract
    if (code === "0x" || code === "0x0") {
      return {
        exists: false,
        message: "No contract exists at this address",
      }
    }

    return {
      exists: true,
      message: "Contract exists at this address",
      codeLength: code.length,
    }
  } catch (err) {
    return {
      exists: false,
      message: `Error checking contract: ${err.message}`,
      error: err,
    }
  }
}

// Function to check account balance
export const checkAccountBalance = async (account, web3Instance = null) => {
  try {
    const web3 = web3Instance || new Web3(window.ethereum || "http://localhost:8545")
    const balance = await web3.eth.getBalance(account)
    const balanceInEth = web3.utils.fromWei(balance, "ether")

    return {
      account,
      balanceWei: balance,
      balanceEth: balanceInEth,
      message: `Account ${account} has ${balanceInEth} ETH`,
    }
  } catch (err) {
    return {
      account,
      message: `Error checking balance: ${err.message}`,
      error: err,
    }
  }
}

// Function to debug a transaction
export const debugTransaction = async (txHash, web3Instance = null) => {
  try {
    const web3 = web3Instance || new Web3(window.ethereum || "http://localhost:8545")

    // Get transaction
    const tx = await web3.eth.getTransaction(txHash)

    // Get transaction receipt
    const receipt = await web3.eth.getTransactionReceipt(txHash)

    // Check if transaction was successful
    const successful = receipt ? receipt.status : false

    return {
      transaction: tx,
      receipt: receipt,
      successful: successful,
      message: successful ? "Transaction was successful" : "Transaction failed",
    }
  } catch (err) {
    return {
      txHash,
      message: `Error debugging transaction: ${err.message}`,
      error: err,
    }
  }
}

// Function to check if a method exists on a contract
export const checkContractMethod = async (contractAddress, abi, methodName, web3Instance = null) => {
  try {
    const web3 = web3Instance || new Web3(window.ethereum || "http://localhost:8545")

    // Create contract instance
    const contract = new web3.eth.Contract(abi, contractAddress)

    // Check if method exists
    const methodExists = typeof contract.methods[methodName] === "function"

    return {
      methodExists,
      message: methodExists
        ? `Method ${methodName} exists on contract`
        : `Method ${methodName} does not exist on contract`,
    }
  } catch (err) {
    return {
      methodExists: false,
      message: `Error checking method: ${err.message}`,
      error: err,
    }
  }
}

export default {
  checkContractExists,
  checkAccountBalance,
  debugTransaction,
  checkContractMethod,
}

