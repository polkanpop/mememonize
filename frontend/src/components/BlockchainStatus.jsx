"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Paper, Chip, CircularProgress, Button, Alert } from "@mui/material"
import web3Service from "../services/web3"

function BlockchainStatus() {
  const [status, setStatus] = useState({
    initialized: false,
    account: null,
    networkId: null,
    balance: null,
    loading: true,
    error: null,
  })

  const fetchStatus = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const { web3, escrowContract, currentAccount } = await web3Service.initWeb3()

      if (!web3 || !currentAccount) {
        throw new Error("Failed to initialize Web3")
      }

      const networkId = await web3.eth.net.getId()
      const balance = await web3.eth.getBalance(currentAccount)
      const balanceInEth = web3.utils.fromWei(balance, "ether")

      setStatus({
        initialized: true,
        account: currentAccount,
        networkId,
        balance: balanceInEth,
        loading: false,
        error: null,
      })
    } catch (err) {
      console.error("Error fetching blockchain status:", err)
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to connect to blockchain",
      }))
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleConnect = async () => {
    await fetchStatus()
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Blockchain Connection Status
      </Typography>

      {status.loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Connecting to blockchain...</Typography>
        </Box>
      ) : status.error ? (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {status.error}
          </Alert>
          <Button variant="contained" onClick={handleConnect}>
            Retry Connection
          </Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            <Chip label={`Network: ${status.networkId || "Unknown"}`} color="primary" variant="outlined" />
            <Chip
              label={`Balance: ${Number.parseFloat(status.balance).toFixed(4)} ETH`}
              color="success"
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            Connected Account: {status.account}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default BlockchainStatus