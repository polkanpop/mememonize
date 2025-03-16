import web3Service from "./web3"
import { assetsApi, transactionsApi } from "./api"

// Sync an asset from blockchain to database
export const syncAssetToDatabase = async (blockchainAssetId, tokenId) => {
  try {
    // Get asset data from blockchain
    const blockchainAsset = await web3Service.getAssetFromBlockchain(blockchainAssetId)

    // Check if asset exists in database by token_id
    let existingAsset
    try {
      const response = await assetsApi.search({ token_id: tokenId })
      existingAsset = response.data.length > 0 ? response.data[0] : null
    } catch (err) {
      console.error("Error searching for asset:", err)
      existingAsset = null
    }

    if (existingAsset) {
      // Update existing asset
      const updatedAsset = {
        ...existingAsset,
        price: blockchainAsset.price,
        is_available: blockchainAsset.isAvailable,
        owner_address: blockchainAsset.owner,
      }

      await assetsApi.update(existingAsset.id, updatedAsset)
      return updatedAsset
    } else {
      // Create new asset
      const newAsset = {
        name: blockchainAsset.name,
        description: `Asset from blockchain with ID ${blockchainAssetId}`,
        price: blockchainAsset.price,
        image_url: "/placeholder.svg?height=400&width=600",
        category: "Blockchain Asset",
        token_id: tokenId,
        owner_address: blockchainAsset.owner,
        is_available: blockchainAsset.isAvailable,
      }

      const response = await assetsApi.create(newAsset)
      return response.data
    }
  } catch (err) {
    console.error("Error syncing asset to database:", err)
    throw err
  }
}

// Sync a transaction from blockchain to database
export const syncTransactionToDatabase = async (blockchainTxId, transactionHash) => {
  try {
    // Get transaction data from blockchain
    const blockchainTx = await web3Service.getTransactionFromBlockchain(blockchainTxId)

    // Check if transaction exists in database by transaction_hash
    let existingTx
    try {
      const response = await transactionsApi.search({ transaction_hash: transactionHash })
      existingTx = response.data.length > 0 ? response.data[0] : null
    } catch (err) {
      console.error("Error searching for transaction:", err)
      existingTx = null
    }

    // Get asset by token_id
    let asset
    try {
      const response = await assetsApi.search({ token_id: blockchainTx.assetId })
      asset = response.data.length > 0 ? response.data[0] : null
    } catch (err) {
      console.error("Error searching for asset:", err)
      asset = null
    }

    if (!asset) {
      // Create asset if it doesn't exist
      asset = await syncAssetToDatabase(blockchainTx.assetId, blockchainTx.assetId)
    }

    if (existingTx) {
      // Update existing transaction
      const updatedTx = {
        ...existingTx,
        status: blockchainTx.status,
        price: blockchainTx.price,
      }

      await transactionsApi.updateStatus(existingTx.id, blockchainTx.status)
      return updatedTx
    } else {
      // Create new transaction
      const newTx = {
        asset_id: asset.id,
        buyer_id: 1, // In a real app, you would look up the user by wallet address
        seller_id: 2, // In a real app, you would look up the user by wallet address
        price: blockchainTx.price,
        transaction_hash: transactionHash,
        status: blockchainTx.status,
      }

      const response = await transactionsApi.create(newTx)
      return response.data
    }
  } catch (err) {
    console.error("Error syncing transaction to database:", err)
    throw err
  }
}

export default {
  syncAssetToDatabase,
  syncTransactionToDatabase,
}

