"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "../../../components/shared/AdminLayout"
import ProductForm from "../../../components/admin/ProductForm"
import { useNotification } from "../../../contexts/NotificationContext"

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [dateFilterType, setDateFilterType] = useState("") // preset or custom
  const { showNotification } = useNotification()
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory, dateRange, allProducts])

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      if (data.success) {
        setAllProducts(data.products)
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const filterProducts = () => {
    let filtered = [...allProducts]

    // Search by name or description
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Filter by date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(product => {
        const productDate = new Date(product.createdAt)
        const startDate = dateRange.start ? new Date(dateRange.start) : null
        const endDate = dateRange.end ? new Date(dateRange.end) : null

        if (startDate && endDate) {
          return productDate >= startDate && productDate <= endDate
        } else if (startDate) {
          return productDate >= startDate
        } else if (endDate) {
          return productDate <= endDate
        }
        return true
      })
    }

    setProducts(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setDateRange({ start: "", end: "" })
    setDateFilterType("")
  }

  const handlePresetDateFilter = (filterType) => {
    const today = new Date()
    const formatDate = (date) => date.toISOString().split('T')[0]
    
    let startDate = null
    let endDate = formatDate(today)
    
    switch (filterType) {
      case '1week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '2weeks':
        startDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '1month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        break
      case '6months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
        break
      case '1year':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        break
      case 'custom':
        // For custom, don't set any dates, let user pick
        setDateRange({ start: "", end: "" })
        setDateFilterType('custom')
        return
      default:
        setDateRange({ start: "", end: "" })
        setDateFilterType("")
        return
    }
    
    if (startDate) {
      setDateRange({ 
        start: formatDate(startDate), 
        end: endDate 
      })
    }
    setDateFilterType(filterType)
  }

  const handleSubmit = async (formData) => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"
      const token = typeof window !== 'undefined' ? localStorage.getItem('kanvei-token') : null

      // Add removed images info for cleanup if editing
      if (editingProduct && formData.removedImages) {
        formData.removedImages = formData.removedImages
      }

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        await fetchProducts()
        setShowForm(false)
        setEditingProduct(null)
        
        showNotification(
          editingProduct ? "Product updated successfully!" : "Product created successfully!", 
          "success"
        )
        
        // Redirect to products page after update
        if (editingProduct) {
          router.push('/admindashboard/products')
        }
      } else {
        showNotification("Error: " + data.error, "error")
      }
    } catch (error) {
      console.error("Error submitting product:", error)
      showNotification("Error submitting product", "error")
    }
  }

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kanvei-token') : null
      
      const res = await fetch(`/api/products/${productId}`, { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (data.success) {
        await fetchProducts()
        showNotification("Product deleted successfully!", "success")
      } else {
        showNotification("Error: " + data.error, "error")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      showNotification("Error deleting product", "error")
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Products
            </h1>
            <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Manage your product inventory
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Add Product
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && <ProductForm product={editingProduct} onSubmit={handleSubmit} onCancel={handleCancel} />}

        {/* Search and Filters */}
        {!showForm && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Search & Filters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Search Products
                </label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Date Filter
                </label>
                <select
                  value={dateFilterType}
                  onChange={(e) => handlePresetDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                >
                  <option value="">All Time</option>
                  <option value="1week">Last 1 Week</option>
                  <option value="2weeks">Last 2 Weeks</option>
                  <option value="1month">Last 1 Month</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last 1 Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Inputs - Only show when custom is selected */}
            {dateFilterType === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  />
                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            {(searchTerm || selectedCategory || dateRange.start || dateRange.end) && (
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
                  style={{
                    borderColor: "#8C6141",
                    color: "#8C6141",
                    fontFamily: "Montserrat, sans-serif"
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Active Filters Display */}
            {(searchTerm || selectedCategory || dateRange.start || dateRange.end || dateFilterType) && (
              <div className="mt-3">
                <p className="text-sm mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Active filters:
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Category: {selectedCategory}
                    </span>
                  )}
                  {dateFilterType && dateFilterType !== 'custom' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Date: {
                        dateFilterType === '1week' ? 'Last 1 Week' :
                        dateFilterType === '2weeks' ? 'Last 2 Weeks' :
                        dateFilterType === '1month' ? 'Last 1 Month' :
                        dateFilterType === '6months' ? 'Last 6 Months' :
                        dateFilterType === '1year' ? 'Last 1 Year' : dateFilterType
                      }
                    </span>
                  )}
                  {dateFilterType === 'custom' && dateRange.start && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      From: {dateRange.start}
                    </span>
                  )}
                  {dateFilterType === 'custom' && dateRange.end && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      To: {dateRange.end}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                All Products ({products.length})
              </h2>
              {allProducts.length !== products.length && (
                <p className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Showing {products.length} of {allProducts.length} products
                </p>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded h-24 animate-pulse"></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 border rounded-lg">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-lg font-semibold"
                            style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
                          >
                            {product.name}
                          </h3>
                          {product.featured && (
                            <span
                              className="px-2 py-1 text-xs font-semibold text-white rounded"
                              style={{ backgroundColor: "#8C6141" }}
                            >
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-1 break-words" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          {product.description?.substring(0, 100)}...
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                          <span
                            className="font-semibold"
                            style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                          >
                            ₹{product.price}
                          </span>
                          <span style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            Category: {product.category}
                          </span>
                          <span
                            className={product.stock > 0 ? "text-green-600" : "text-red-600"}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                          >
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border-2 font-semibold rounded-md hover:opacity-80 transition-opacity"
                        style={{
                          borderColor: "#8C6141",
                          color: "#8C6141",
                          fontFamily: "Montserrat, sans-serif",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                No products found. Create your first product!
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
