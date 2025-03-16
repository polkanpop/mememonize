"use client"

import { Link as RouterLink } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Link,
  Button,
  Stack,
  Tooltip,
} from "@mui/material"
import { BugReport as BugReportIcon } from "@mui/icons-material"

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "completed":
      return "success"
    case "pending":
      return "warning"
    case "cancelled":
      return "error"
    default:
      return "default"
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString()
}

function TransactionTable({ transactions = [], onComplete, onCancel, onDebug }) {
  if (transactions.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: "center", my: 4 }}>
        No transactions found.
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="transaction table">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Buyer</TableCell>
            <TableCell>Seller</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Link component={RouterLink} to={`/asset/${transaction.asset.id}`}>
                  {transaction.asset.name}
                </Link>
              </TableCell>
              <TableCell>{transaction.price} ETH</TableCell>
              <TableCell>
                {transaction.buyer.username || transaction.buyer.wallet_address.substring(0, 8) + "..."}
              </TableCell>
              <TableCell>
                {transaction.seller.username || transaction.seller.wallet_address.substring(0, 8) + "..."}
              </TableCell>
              <TableCell>{formatDate(transaction.created_at)}</TableCell>
              <TableCell>
                <Chip label={transaction.status} color={getStatusColor(transaction.status)} size="small" />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {transaction.status === "pending" && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => onComplete && onComplete(transaction)}
                      >
                        Complete
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => onCancel && onCancel(transaction)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {onDebug && (
                    <Tooltip title="Debug Transaction">
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => onDebug(transaction)}
                        sx={{ minWidth: "40px", px: 1 }}
                      >
                        <BugReportIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
                {transaction.transaction_hash && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, fontSize: "0.7rem" }}>
                    TX: {transaction.transaction_hash.substring(0, 10)}...
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default TransactionTable

