"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
} from "@mui/material"
import TransactionTable from "../components/TransactionTable"
import { transactionsApi } from "../services/api"
import web3Service from "../services/web3"

function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null, // 'complete' or 'cancel'
    transaction: null,
    loading: false,
  })
  const [web3State, setWeb3State] = useState({
    initialized: false,
    account: null,
    networkId: null,
  })

  // Initialize Web3
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const { web3, escrowContract, currentAccount } = await web3Service.initWeb3()

        if (web3 && currentAccount) {
          const networkId = await web3.eth.net.getId()

          setWeb3State({
            initialized: true,
            account: currentAccount,
            networkId: networkId,
          })

          console.log(`Web3 initialized. Connected to network ${networkId} with account ${currentAccount}`)
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

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError(null)

      try {
        // In a real app, we would filter by the current user
        // For demo purposes, we'll fetch all transactions
        const response = await transactionsApi.getAll()
        setTransactions(response.data)
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError("Failed to load transaction history. Please try again later.")

        // Show mock data for development if API fails
        setTransactions([
          {
            id: 1,
            asset_id: 1,
            buyer_id: 1,
            seller_id: 2,
            price: 0.5,
            transaction_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            asset: {
              id: 1,
              name: "Sample Asset",
              description: "This is a sample asset",
              price: 0.5,
              image_url: "/placeholder.svg?height=200&width=300",
              category: "Art",
              token_id: "1",
              owner_address: "0x1234567890abcdef1234567890abcdef12345678",
              is_available: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            buyer: {
              id: 1,
              wallet_address: "0x1234567890abcdef1234567890abcdef12345678",
              username: "buyer",
              email: "buyer@example.com",
              created_at: new Date().toISOString(),
            },
            seller: {
              id: 2,
              wallet_address: "0xabcdef1234567890abcdef1234567890abcdef12",
              username: "seller",
              email: "seller@example.com",
              created_at: new Date().toISOString(),
            },
          },
        ])

        setSnackbar({
          open: true,
          message: "Could not connect to API. Using mock data for demonstration.",
          severity: "warning",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleTransactionAction = (transaction, actionType) => {
    if (!web3State.initialized) {
      setSnackbar({
        open: true,
        message: "Please connect to MetaMask first.",
        severity: "warning",
      })
      return
    }

    setActionDialog({
      open: true,
      type: actionType,
      transaction,
      loading: false,
    })
  }

  const handleCloseDialog = () => {
    setActionDialog({
      ...actionDialog,
      open: false,
    })
  }

  const handleConfirmAction = async () => {
    setActionDialog({
      ...actionDialog,
      loading: true,
    })

    try {
      const { transaction, type } = actionDialog

      if (!transaction.transaction_hash) {
        throw new Error("Transaction hash not found")
      }

      // Extract transaction ID from the hash or use the hash itself
      // In a real app, you would store the blockchain transaction ID
      const transactionId = transaction.blockchain_transaction_id || transaction.transaction_hash

      console.log(`Attempting to ${type} transaction with ID: ${transactionId}`)

      let result

      if (type === "complete") {
        // Complete transaction on blockchain
        result = await web3Service.completeTransaction(transactionId)
      } else if (type === "cancel") {
        // Cancel transaction on blockchain
        result = await web3Service.cancelTransaction(transactionId)
      }

      console.log(`${type} transaction result:`, result)

      // Update transaction in database
      try {
        await transactionsApi.updateStatus(transaction.id, type === "complete" ? "completed" : "cancelled")
      } catch (apiErr) {
        console.error("Error updating transaction in database:", apiErr)
        // Continue anyway since the blockchain transaction was successful
      }

      // Update local state
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === transaction.id ? { ...tx, status: type === "complete" ? "completed" : "cancelled" } : tx,
        ),
      )

      setActionDialog({
        open: false,
        type: null,
        transaction: null,
        loading: false,
      })

      setSnackbar({
        open: true,
        message: `Transaction ${type === "complete" ? "completed" : "cancelled"} successfully!`,
        severity: "success",
      })
    } catch (err) {
      console.error(`Error ${actionDialog.type === "complete" ? "completing" : "cancelling"} transaction:`, err)

      let errorMessage = `Failed to ${actionDialog.type === "complete" ? "complete" : "cancel"} transaction`

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
            errorMessage =
              "Internal JSON-RPC error. This might be due to contract restrictions or invalid transaction ID."
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
      setActionDialog({
        ...actionDialog,
        loading: false,
      })
    }
  }

  // Filter transactions based on tab
  const filteredTransactions = transactions.filter((transaction) => {
    if (tabValue === 0) return true // All transactions
    if (tabValue === 1) return transaction.status === "completed"
    if (tabValue === 2) return transaction.status === "pending"
    if (tabValue === 3) return transaction.status === "cancelled"
    return true
  })

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Transaction History
      </Typography>

      {!web3State.initialized && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Blockchain connection not established. Some features may be limited.
        </Alert>
      )}

      {web3State.initialized && web3State.account && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
          <Typography variant="body2">Connected account: {web3State.account}</Typography>
          <Typography variant="body2">Network ID: {web3State.networkId}</Typography>
        </Paper>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="transaction tabs">
          <Tab label="All" />
          <Tab label="Completed" />
          <Tab label="Pending" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      ) : (
        <TransactionTable
          transactions={filteredTransactions}
          onComplete={(transaction) => handleTransactionAction(transaction, "complete")}
          onCancel={(transaction) => handleTransactionAction(transaction, "cancel")}
        />
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={handleCloseDialog} aria-labelledby="action-dialog-title">
        <DialogTitle id="action-dialog-title">
          {actionDialog.type === "complete" ? "Complete Transaction" : "Cancel Transaction"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {actionDialog.type === "complete" ? "complete" : "cancel"} this transaction?
            {actionDialog.type === "complete"
              ? " This will release the funds to the seller and transfer the asset to you."
              : " This will refund your payment and return the asset to the seller."}
          </DialogContentText>

          {actionDialog.transaction && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                Asset: {actionDialog.transaction.asset?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Price: {actionDialog.transaction.price} ETH
              </Typography>
              <Typography variant="body2" gutterBottom>
                Transaction Hash: {actionDialog.transaction.transaction_hash?.substring(0, 10)}...
              </Typography>
              <Typography variant="body2" color="warning.main">
                Note: This action cannot be undone once confirmed on the blockchain.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={actionDialog.loading}>
            No
          </Button>
          <Button onClick={handleConfirmAction} color="primary" variant="contained" disabled={actionDialog.loading}>
            {actionDialog.loading ? "Processing..." : "Yes, Confirm"}
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

export default TransactionHistory

