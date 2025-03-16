"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material"
import AssetDetailCard from "../components/AssetDetailCard"
import { assetsApi, transactionsApi } from "../services/api"
import web3Service from "../services/web3"
import blockchainDebug from "../utils/blockchain-debug"
import MememonizeEscrowABI from "../contracts/MememonizeEscrow.json"

function AssetDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchaseDialog, setPurchaseDialog] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })
  const [web3State, setWeb3State] = useState({
    initialized: false,
    account: null,
    networkId: null,
    balance: null,
  })
  const [debugInfo, setDebugInfo] = useState(null)
  const [showDebug, setShowDebug] = useState(false)

  // Initialize Web3
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const { web3, escrowContract, currentAccount } = await web3Service.initWeb3()

        if (web3 && currentAccount) {
          const networkId = await web3.eth.net.getId()
          const balance = await web3.eth.getBalance(currentAccount)
          const balanceInEth = web3.utils.fromWei(balance, "ether")

          setWeb3State({
            initialized: true,
            account: currentAccount,
            networkId: networkId,
            balance: balanceInEth,
          })

          console.log(`Web3 initialized. Connected to network ${networkId} with account ${currentAccount}`)
          console.log(`Account balance: ${balanceInEth} ETH`)
        } else {
          setSnackbar({
            open: true,
            message: "Failed to connect to blockchain. Please make sure you have MetaMask installed.",
            severity: "warning",
          })
        }
      } catch (err) {
        console.error("Error initializing web3:", err)
        setSnackbar({
          open: true,
          message: "Failed to connect to blockchain. Please make sure you have MetaMask installed.",
          severity: "error",
        })
      }
    }

    initWeb3()
  }, [])

  // Fetch asset data
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get asset from backend database
        const response = await assetsApi.getById(id)
        const assetData = response.data

        // If web3 is initialized and asset has a token_id, try to get blockchain data
        if (web3State.initialized && assetData.token_id) {
          try {
            // Get additional data from blockchain
            const blockchainAsset = await web3Service.getAssetFromBlockchain(assetData.token_id)

            // Merge data (prioritize blockchain data for availability and price)
            setAsset({
              ...assetData,
              is_available: blockchainAsset.isAvailable,
              price: blockchainAsset.price,
              blockchain_owner: blockchainAsset.owner,
            })
          } catch (blockchainErr) {
            console.warn("Could not fetch blockchain data:", blockchainErr)
            setAsset(assetData)
          }
        } else {
          setAsset(assetData)
        }
      } catch (err) {
        console.error("Error fetching asset:", err)
        setError("The asset could not be found.")
        setSnackbar({
          open: true,
          message: "The asset could not be found.",
          severity: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [id, web3State.initialized])

  const handlePurchase = (asset) => {
    if (!web3State.initialized) {
      setSnackbar({
        open: true,
        message: "Please connect to MetaMask first.",
        severity: "warning",
      })
      return
    }

    if (!asset.token_id) {
      setSnackbar({
        open: true,
        message: "This asset doesn't have a valid token ID.",
        severity: "error",
      })
      return
    }

    // Check if user has enough balance
    const assetPrice = Number.parseFloat(asset.price)
    const userBalance = Number.parseFloat(web3State.balance)

    if (userBalance < assetPrice) {
      setSnackbar({
        open: true,
        message: `Insufficient balance. You have ${userBalance.toFixed(4)} ETH but need at least ${assetPrice.toFixed(4)} ETH.`,
        severity: "error",
      })
      return
    }

    setPurchaseDialog(true)
  }

  const handleConfirmPurchase = async () => {
    setPurchaseLoading(true)

    try {
      console.log("Starting purchase process for asset:", asset)

      // 1. Interact with the blockchain
      const blockchainResult = await web3Service.purchaseAsset(asset.token_id, asset.price)
      console.log("Blockchain transaction result:", blockchainResult)

      if (!blockchainResult.transactionHash) {
        throw new Error("Failed to get transaction hash from blockchain")
      }

      // 2. Record the transaction in our database
      const response = await transactionsApi.create({
        asset_id: asset.id,
        buyer_id: 1, // In a real app, this would be the current user's ID
        seller_id: 2, // In a real app, this would be the asset owner's ID
        price: asset.price,
        transaction_hash: blockchainResult.transactionHash,
        blockchain_transaction_id: blockchainResult.transactionId, // Store the blockchain transaction ID
        status: "pending",
      })

      console.log("Database transaction created:", response.data)

      setPurchaseDialog(false)
      setSnackbar({
        open: true,
        message: "Purchase successful! Transaction is pending confirmation.",
        severity: "success",
      })

      // Navigate to transactions page after successful purchase
      setTimeout(() => {
        navigate("/transactions")
      }, 2000)
    } catch (err) {
      console.error("Error purchasing asset:", err)

      let errorMessage = "Failed to purchase asset"

      // Extract more specific error message if available
      if (err.message) {
        errorMessage += `: ${err.message}`
      }

      // Check for common MetaMask errors
      if (err.code) {
        switch (err.code) {
          case 4001:
            errorMessage = "Transaction rejected by user"
            break
          case -32603:
            errorMessage = "Internal JSON-RPC error. This might be due to insufficient funds or contract error."
            break
          default:
            errorMessage += ` (Code: ${err.code})`
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setPurchaseDialog(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleDebugContract = async () => {
    setShowDebug(true)

    try {
      const contractAddress = MememonizeEscrowABI.networks[web3State.networkId]?.address

      if (!contractAddress) {
        setDebugInfo({
          error: `No contract address found for network ID ${web3State.networkId}`,
        })
        return
      }

      // Check if contract exists
      const contractExists = await blockchainDebug.checkContractExists(contractAddress)

      // Check account balance
      const accountBalance = await blockchainDebug.checkAccountBalance(web3State.account)

      // Check if purchaseAsset method exists
      const methodExists = await blockchainDebug.checkContractMethod(
        contractAddress,
        MememonizeEscrowABI.abi,
        "purchaseAsset",
      )

      // Check asset on blockchain
      let assetInfo = null
      try {
        assetInfo = await web3Service.getAssetFromBlockchain(asset.token_id)
      } catch (err) {
        assetInfo = { error: err.message }
      }

      setDebugInfo({
        contractAddress,
        contractExists,
        accountBalance,
        methodExists,
        assetInfo,
        networkId: web3State.networkId,
        account: web3State.account,
        assetTokenId: asset.token_id,
      })
    } catch (err) {
      setDebugInfo({
        error: err.message,
      })
    }
  }

  return (
    <Container maxWidth="lg">
      {!web3State.initialized && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Blockchain connection not established. Some features may be limited.
        </Alert>
      )}

      {web3State.initialized && web3State.account && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
          <Typography variant="body2">Connected account: {web3State.account}</Typography>
          <Typography variant="body2">Network ID: {web3State.networkId}</Typography>
          <Typography variant="body2">Balance: {Number.parseFloat(web3State.balance).toFixed(4)} ETH</Typography>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          <AssetDetailCard asset={asset} onPurchase={handlePurchase} />

          {asset && asset.token_id && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Blockchain Details
              </Typography>
              <Typography variant="body2">Token ID: {asset.token_id}</Typography>
              {asset.blockchain_owner && (
                <Typography variant="body2">Owner Address: {asset.blockchain_owner}</Typography>
              )}
              <Typography variant="body2" color={asset.is_available ? "success.main" : "error.main"}>
                Status: {asset.is_available ? "Available" : "Not Available"}
              </Typography>

              <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={handleDebugContract}>
                Debug Contract
              </Button>
            </Paper>
          )}

          {showDebug && debugInfo && (
            <Accordion sx={{ mt: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Blockchain Debug Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialog} onClose={handleCloseDialog} aria-labelledby="purchase-dialog-title">
        <DialogTitle id="purchase-dialog-title">Confirm Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to purchase {asset?.name} for {asset?.price} ETH? This will initiate a blockchain
            transaction from your account ({web3State.account}).
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              Your balance: {Number.parseFloat(web3State.balance).toFixed(4)} ETH
            </Typography>
            <Typography variant="body2" gutterBottom>
              Asset price: {asset?.price} ETH
            </Typography>
            <Typography variant="body2" gutterBottom>
              Estimated gas: ~0.001 ETH
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              Remaining after purchase: ~
              {(Number.parseFloat(web3State.balance) - Number.parseFloat(asset?.price || 0) - 0.001).toFixed(4)} ETH
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={purchaseLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmPurchase} color="primary" variant="contained" disabled={purchaseLoading}>
            {purchaseLoading ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AssetDetails

