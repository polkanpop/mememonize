"use client"

import { useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import web3Service from "../services/web3"
import { assetsApi } from "../services/api"

const categories = ["Art", "Collectibles", "Music", "Gaming", "Virtual Real Estate"]

function ListAssetForm() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate form
      if (!formData.name || !formData.price) {
        throw new Error("Name and price are required")
      }

      if (isNaN(Number.parseFloat(formData.price)) || Number.parseFloat(formData.price) <= 0) {
        throw new Error("Price must be a positive number")
      }

      // 1. List asset on blockchain
      const blockchainResult = await web3Service.listAsset(formData.name, formData.price)
      console.log("Blockchain listing result:", blockchainResult)

      if (!blockchainResult.assetId) {
        throw new Error("Failed to get asset ID from blockchain")
      }

      // 2. Create asset in database
      const assetData = {
        ...formData,
        token_id: blockchainResult.assetId,
        is_available: true,
        owner_address: await web3Service.getCurrentAccount(),
      }

      const response = await assetsApi.create(assetData)
      console.log("Database asset created:", response.data)

      // Success!
      setSuccess(true)
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
      })

      setSnackbar({
        open: true,
        message: `Asset "${formData.name}" listed successfully with ID ${blockchainResult.assetId}!`,
        severity: "success",
      })
    } catch (err) {
      console.error("Error listing asset:", err)
      setError(err.message || "Failed to list asset")
      setSnackbar({
        open: true,
        message: `Error: ${err.message || "Failed to list asset"}`,
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        List New Asset
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Asset listed successfully!
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Asset Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          fullWidth
          id="description"
          label="Description"
          name="description"
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="price"
          label="Price (ETH)"
          name="price"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={formData.price}
          onChange={handleChange}
          disabled={loading}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            label="Category"
            disabled={loading}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          margin="normal"
          fullWidth
          id="image_url"
          label="Image URL"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          disabled={loading}
          helperText="Leave empty to use a placeholder image"
        />

        <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "List Asset on Blockchain"}
        </Button>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}

export default ListAssetForm

