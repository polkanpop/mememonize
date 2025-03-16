import axios from "axios"

// Create an axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Assets API
export const assetsApi = {
  getAll: () => api.get("/assets"),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post("/assets", data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
}

// Transactions API
export const transactionsApi = {
  getAll: () => api.get("/transactions"),
  getById: (id) => api.get(`/transactions/${id}`),
  getByUser: (userId) => api.get(`/transactions/user/${userId}`),
  create: (data) => api.post("/transactions", data),
  updateStatus: (id, status) => api.put(`/transactions/${id}/status?status=${status}`),
}

// Search API
export const searchApi = {
  search: (params) => api.get("/search", { params }),
  getCategories: () => api.get("/search/categories"),
}

export default api

