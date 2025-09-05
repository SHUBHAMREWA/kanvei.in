"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import AdminLayout from "../../../components/shared/AdminLayout"
import { useToast } from "../../../contexts/ToastContext"
import { useNotification } from "../../../contexts/NotificationContext"
import { 
  AiOutlineEye, 
  AiOutlineCalendar, 
  AiOutlineUser, 
  AiOutlinePhone,
  AiOutlineClose,
  AiOutlineShop
} from "react-icons/ai"
import { 
  MdLocalShipping, 
  MdDone, 
  MdCancel, 
  MdHourglassEmpty, 
  MdDeliveryDining,
  MdLocationOn,
  MdPayment
} from "react-icons/md"

export default function AdminOrders() {
  const { showSuccess, showError, showWarning } = useToast()
  const { showNotification } = useNotification()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" })
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [selectedOrderItems, setSelectedOrderItems] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [selectedOrderAddress, setSelectedOrderAddress] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrderPayment, setSelectedOrderPayment] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      } else {
        console.error('Error fetching orders:', data.error)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()
      if (data.success) {
        await fetchOrders()
        showSuccess('✅ Order status updated successfully!')
      } else {
        showError('❌ Error: ' + data.error)
      }
    } catch (error) {
      console.error("Error updating order:", error)
      showError('❌ Error updating order status')
    }
  }

  // Helper function to check if date falls within range
  const isDateInRange = (orderDate, dateFilter, customRange) => {
    const now = new Date()
    const orderDateObj = new Date(orderDate)
    
    switch (dateFilter) {
      case "today":
        return orderDateObj.toDateString() === now.toDateString()
      case "yesterday":
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        return orderDateObj.toDateString() === yesterday.toDateString()
      case "last_7_days":
        const last7Days = new Date(now)
        last7Days.setDate(last7Days.getDate() - 7)
        return orderDateObj >= last7Days && orderDateObj <= now
      case "last_30_days":
        const last30Days = new Date(now)
        last30Days.setDate(last30Days.getDate() - 30)
        return orderDateObj >= last30Days && orderDateObj <= now
      case "last_3_months":
        const last3Months = new Date(now)
        last3Months.setMonth(last3Months.getMonth() - 3)
        return orderDateObj >= last3Months && orderDateObj <= now
      case "last_6_months":
        const last6Months = new Date(now)
        last6Months.setMonth(last6Months.getMonth() - 6)
        return orderDateObj >= last6Months && orderDateObj <= now
      case "last_year":
        const lastYear = new Date(now)
        lastYear.setFullYear(lastYear.getFullYear() - 1)
        return orderDateObj >= lastYear && orderDateObj <= now
      case "custom":
        if (!customRange.start || !customRange.end) return true
        const startDate = new Date(customRange.start)
        const endDate = new Date(customRange.end)
        endDate.setHours(23, 59, 59, 999) // Include the entire end date
        return orderDateObj >= startDate && orderDateObj <= endDate
      default:
        return true
    }
  }

  // Helper function to get order ID
  const getOrderId = (order) => {
    // If order has the new orderId field, use it with a # prefix
    if (order?.orderId) {
      return `#${order.orderId}`
    }
    // Fallback to formatting the MongoDB _id (for legacy orders)
    const mongoId = order?._id || order
    return `#${mongoId.toString().slice(-8).toUpperCase()}`
  }

  // Helper function to check if order matches search (Order ID, customer name, email, phone)
  const matchesCustomerSearch = (order, searchTerm) => {
    if (!searchTerm.trim()) return true
    
    const search = searchTerm.toLowerCase().trim()
    
    // Get Order ID for comparison
    const orderIdDisplay = getOrderId(order).toLowerCase() // This includes #
    const orderIdOnly = orderIdDisplay.replace('#', '') // Without #
    
    // Customer details
    const customerName = (order.shippingAddress?.name || order.userId?.name || '').toLowerCase()
    const customerEmail = (order.userId?.email || order.customerEmail || '').toLowerCase()
    const customerPhone = (order.shippingAddress?.phone || '').toLowerCase()
    
    // Check if search matches Order ID (with or without #)
    const matchesOrderId = orderIdDisplay.includes(search) || orderIdOnly.includes(search)
    
    // Check if search matches customer details
    const matchesCustomer = customerName.includes(search) || 
                           customerEmail.includes(search) || 
                           customerPhone.includes(search)
    
    return matchesOrderId || matchesCustomer
  }

  // Apply all filters
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (filter !== "all" && order.status !== filter) {
      return false
    }
    
    // Date filter
    if (dateFilter !== "all" && !isDateInRange(order.createdAt, dateFilter, customDateRange)) {
      return false
    }
    
    // Customer search filter
    if (!matchesCustomerSearch(order, customerSearch)) {
      return false
    }
    
    return true
  })

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipping":
        return "bg-purple-100 text-purple-800"
      case "out_for_delivery":
        return "bg-indigo-100 text-indigo-800"
      case "return_accepted":
        return "bg-orange-100 text-orange-800"
      case "return_not_accepted":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <MdDone className="w-4 h-4" />
      case "pending":
        return <MdHourglassEmpty className="w-4 h-4" />
      case "cancelled":
        return <MdCancel className="w-4 h-4" />
      case "processing":
        return <MdHourglassEmpty className="w-4 h-4" />
      case "shipping":
        return <MdLocalShipping className="w-4 h-4" />
      case "out_for_delivery":
        return <MdDeliveryDining className="w-4 h-4" />
      case "return_accepted":
        return <MdDone className="w-4 h-4" />
      case "return_not_accepted":
        return <MdCancel className="w-4 h-4" />
      default:
        return <MdHourglassEmpty className="w-4 h-4" />
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
  }

  const handleViewItems = (order) => {
    setSelectedOrderItems(order)
    setShowItemsModal(true)
  }

  const handleCloseItemsModal = () => {
    setShowItemsModal(false)
    setSelectedOrderItems(null)
  }

  const handleViewAddress = (order) => {
    setSelectedOrderAddress(order)
    setShowAddressModal(true)
  }

  const handleCloseAddressModal = () => {
    setShowAddressModal(false)
    setSelectedOrderAddress(null)
  }

  const handleViewPayment = (order) => {
    setSelectedOrderPayment(order)
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedOrderPayment(null)
  }

  const getPaymentStatusColor = (paymentStatus, paymentMethod) => {
    if (!paymentMethod) return "bg-gray-100 text-gray-800"
    
    switch (paymentStatus?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentMethodIcon = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case "razorpay":
        return "💳"
      case "cod":
        return "💵"
      case "card":
        return "💳"
      case "upi":
        return "📱"
      default:
        return "💰"
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()
      if (data.success) {
        await fetchOrders()
        // Update selected order if modal is open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({...selectedOrder, status: newStatus})
        }
        showSuccess(`✅ Order status updated to '${newStatus.replace('_', ' ')}' successfully!`)
      } else {
        // Show specific error message from API
        showError(`❌ ${data.error || 'Failed to update order status'}`)
        console.error('API Error:', data.error)
      }
    } catch (error) {
      console.error("Error updating order:", error)
      showError('❌ Network error: Could not update order status. Please check your connection.')
    } finally {
      setUpdating(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Orders
              </h1>
              <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Manage customer orders with advanced filtering
              </p>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Filter & Search Orders
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Order Status
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipping">Shipping</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="return_accepted">Return Accepted</option>
                  <option value="return_not_accepted">Return Not Accepted</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="last_year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Order & Customer Search */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  Search Order or Customer
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Order ID (#KNV...), name, email, or phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilter("all")
                    setDateFilter("all")
                    setCustomerSearch("")
                    setCustomDateRange({ start: "", end: "" })
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
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
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                  />
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="mt-4 flex flex-wrap gap-2">
              {filter !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Status: {filter.replace('_', ' ')}
                </span>
              )}
              {dateFilter !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Date: {dateFilter === "custom" ? "Custom Range" : dateFilter.replace('_', ' ')}
                </span>
              )}
              {customerSearch.trim() && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Search: {customerSearch}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  {/* Dynamic title based on active filters */}
                  {(() => {
                    let title = "Orders"
                    const filterParts = []
                    
                    if (filter !== "all") {
                      filterParts.push(filter.replace('_', ' '))
                    }
                    
                    if (dateFilter !== "all") {
                      if (dateFilter === "custom" && customDateRange.start && customDateRange.end) {
                        filterParts.push(`${new Date(customDateRange.start).toLocaleDateString('en-IN')} to ${new Date(customDateRange.end).toLocaleDateString('en-IN')}`)
                      } else {
                        filterParts.push(dateFilter.replace('_', ' '))
                      }
                    }
                    
                    if (customerSearch.trim()) {
                      filterParts.push(`matching "${customerSearch.trim()}"`)
                    }
                    
                    if (filterParts.length > 0) {
                      title += " - " + filterParts.join(", ")
                    }
                    
                    return title
                  })()} ({filteredOrders.length})
                </h2>
                {(filter !== "all" || dateFilter !== "all" || customerSearch.trim()) && (
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    Showing filtered results from {orders.length} total orders
                  </p>
                )}
              </div>
              
              {/* Results summary */}
              {filteredOrders.length > 0 && (
                <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  <div className="flex items-center space-x-4">
                    <span>Total Value: <strong style={{ color: "#5A0117" }}>
                      {formatPrice(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
                    </strong></span>
                    {dateFilter !== "all" && (
                      <span>Avg Order: <strong style={{ color: "#5A0117" }}>
                        {formatPrice(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length)}
                      </strong></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded h-16 animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Shipping Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order, index) => (
                    <tr key={order._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          {getOrderId(order)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          <div className="flex items-center">
                            <AiOutlineCalendar className="w-4 h-4 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleTimeString('en-IN')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          <div className="flex items-center">
                            <AiOutlineUser className="w-4 h-4 mr-1" />
                            {order.shippingAddress?.name || order.userId?.name || 'N/A'}
                          </div>
                          {order.shippingAddress?.phone && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <AiOutlinePhone className="w-3 h-3 mr-1" />
                              {order.shippingAddress.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          <div 
                            className="flex items-center cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleViewItems(order)}
                          >
                            <AiOutlineShop className="w-4 h-4 mr-1" />
                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                          </div>
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <div 
                              key={idx} 
                              className="text-xs text-gray-500 mt-1 truncate max-w-[150px] cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => handleViewItems(order)}
                            >
                              {item.productId?._id ? (
                                <span>
                                  {item.name} × {item.quantity}
                                </span>
                              ) : (
                                <span>{item.name} × {item.quantity}</span>
                              )}
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div 
                              className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => handleViewItems(order)}
                            >
                              +{order.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          {order.shippingAddress ? (
                            <div 
                              className="cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => handleViewAddress(order)}
                            >
                              <div className="flex items-center">
                                <MdLocationOn className="w-4 h-4 mr-1" />
                                <span className="truncate max-w-[120px]">
                                  {order.shippingAddress.city || 'N/A'}, {order.shippingAddress.state || 'N/A'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.shippingAddress.pincode || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <MdLocationOn className="w-4 h-4 mr-1" />
                              <span>No Address</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          {formatPrice(order.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          {order.paymentMethod ? (
                            <div 
                              className="cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => handleViewPayment(order)}
                            >
                              <div className="flex items-center">
                                <span className="mr-1">{getPaymentMethodIcon(order.paymentMethod)}</span>
                                <span className="capitalize truncate max-w-[80px]">
                                  {order.paymentMethod}
                                </span>
                              </div>
                              <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-flex items-center ${getPaymentStatusColor(order.paymentStatus, order.paymentMethod)}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                                <span className="capitalize">
                                  {order.paymentStatus || 'pending'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <span className="mr-1">💰</span>
                              <span>No Payment</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">
                            {order.status?.replace('_', ' ')}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                            title="View Order Details"
                          >
                            <AiOutlineEye className="w-4 h-4" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            disabled={updating}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50"
                            style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipping">Shipping</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="return_accepted">Return Accepted</option>
                            <option value="return_not_accepted">Return Not Accepted</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AiOutlineShop className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
                No orders found
              </h3>
              <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                No orders found for the selected filter.
              </p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Order Details {getOrderId(selectedOrder)}
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')} at {new Date(selectedOrder.createdAt).toLocaleTimeString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status and Actions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Current Status:
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-2 capitalize">
                          {selectedOrder.status?.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Update Status:
                      </span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                        disabled={updating}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50"
                        style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipping">Shipping</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="return_accepted">Return Accepted</option>
                        <option value="return_not_accepted">Return Not Accepted</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Customer Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center">
                        <AiOutlineUser className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {selectedOrder.shippingAddress?.name || selectedOrder.userId?.name || 'N/A'}
                          </p>
                          {selectedOrder.userId?.email && (
                            <p className="text-sm text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                              {selectedOrder.userId.email}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedOrder.shippingAddress?.phone && (
                        <div className="flex items-center">
                          <AiOutlinePhone className="w-5 h-5 mr-3 text-gray-400" />
                          <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            {selectedOrder.shippingAddress.phone}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Shipping Address */}
                    <h5 className="font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Shipping Address
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <MdLocationOn className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                        <div className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          <p>{selectedOrder.shippingAddress?.address}</p>
                          <p>
                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <h5 className="font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Payment Information
                    </h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <MdPayment className="w-5 h-5 mr-3 text-gray-400" />
                        <div>
                          <p className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {selectedOrder.paymentMethod || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Total: {formatPrice(selectedOrder.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Order Items ({selectedOrder.items?.length || 0})
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 bg-white rounded-lg p-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.productId?._id ? (
                            <Link 
                              href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                              className="block w-full h-full hover:opacity-90 transition-opacity"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.productId?.images && item.productId.images.length > 0 ? (
                                <img
                                  src={item.productId.images[0]}
                                  alt={item.name || item.productId?.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer">
                                  <AiOutlineShop className="w-6 h-6" style={{ color: "#8C6141" }} />
                                </div>
                              )}
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer" style={{
                                display: item.productId?.images && item.productId.images.length > 0 ? 'none' : 'flex'
                              }}>
                                <AiOutlineShop className="w-6 h-6" style={{ color: "#8C6141" }} />
                              </div>
                            </Link>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <AiOutlineShop className="w-6 h-6" style={{ color: "#8C6141" }} />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          {item.productId?._id ? (
                            <Link
                              href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                              className="font-medium hover:underline cursor-pointer transition-colors inline-block"
                              style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.name || item.productId?.name || 'Product Name'}
                              {item.itemType === 'productOption' && item.productId?.size && item.productId?.color && (
                                <span className="text-sm font-normal ml-2 text-gray-600">
                                  ({item.productId.size}, {item.productId.color})
                                </span>
                              )}
                            </Link>
                          ) : (
                            <h6 className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              {item.name || item.product?.name || 'Product Name'}
                              {item.size && item.color && (
                                <span className="text-sm font-normal ml-2 text-gray-600">
                                  ({item.size}, {item.color})
                                </span>
                              )}
                            </h6>
                          )}
                          <div className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            <span>Quantity: {item.quantity}</span>
                            <span className="mx-2">•</span>
                            <span>Price: {formatPrice(item.price)}</span>
                          </div>
                          {item.productId?._id && (
                            <div className="mt-1">
                              <Link
                                href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                                className="text-xs px-2 py-1 border rounded hover:bg-gray-50 transition-colors inline-block"
                                style={{ color: "#8C6141", borderColor: "#8C6141" }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View {item.itemType === 'productOption' ? 'Option' : 'Product'} →
                              </Link>
                            </div>
                          )}
                        </div>
                            
                            {/* Price */}
                            <div className="text-right">
                              <p className="font-bold text-lg" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Order Total */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            Total Amount:
                          </span>
                          <span className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            {formatPrice(selectedOrder.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Modal */}
        {showItemsModal && selectedOrderItems && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Order Items - {getOrderId(selectedOrderItems)}
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    {selectedOrderItems.items?.length || 0} item{selectedOrderItems.items?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleCloseItemsModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {selectedOrderItems.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                      {/* Product Image and Title - Left Side */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.productId?.images && item.productId.images.length > 0 ? (
                            <img
                              src={item.productId.images[0]}
                              alt={item.name || item.productId?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center" style={{
                            display: item.productId?.images && item.productId.images.length > 0 ? 'none' : 'flex'
                          }}>
                            <AiOutlineShop className="w-8 h-8" style={{ color: "#8C6141" }} />
                          </div>
                        </div>
                        
                        {/* Product Title */}
                        <div className="flex-1">
                          {item.productId?._id ? (
                            <Link
                              href={`/products/${item.productId._id}`}
                              className="font-medium text-lg hover:underline cursor-pointer transition-colors inline-block"
                              style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.name || item.productId?.name || 'Product Name'}
                            </Link>
                          ) : (
                            <h6 className="font-medium text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              {item.name || item.product?.name || 'Product Name'}
                            </h6>
                          )}
                          <div className="text-sm text-gray-600 mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            <div>Unit Price: {formatPrice(item.price)}</div>
                            <div className="font-semibold" style={{ color: "#5A0117" }}>
                              Total: {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quantity - Right Side */}
                      <div className="text-right">
                        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                          <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            Qty
                          </p>
                          <p className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={handleCloseItemsModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Address Modal */}
        {showAddressModal && selectedOrderAddress && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Shipping Address - {getOrderId(selectedOrderAddress)}
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    Delivery address for this order
                  </p>
                </div>
                <button
                  onClick={handleCloseAddressModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {selectedOrderAddress.shippingAddress ? (
                  <div className="space-y-4">
                    {/* Customer Name */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <AiOutlineUser className="w-5 h-5 mr-3 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            Customer Name
                          </p>
                          <p className="text-lg font-bold mt-1" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            {selectedOrderAddress.shippingAddress.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Phone Number */}
                    {selectedOrderAddress.shippingAddress.phone && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <AiOutlinePhone className="w-5 h-5 mr-3 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                              Phone Number
                            </p>
                            <p className="text-lg font-bold mt-1" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                              {selectedOrderAddress.shippingAddress.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full Address */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <MdLocationOn className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            Complete Address
                          </p>
                          <div className="text-base" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {selectedOrderAddress.shippingAddress.address && (
                              <p className="mb-2 font-medium">
                                {selectedOrderAddress.shippingAddress.address}
                              </p>
                            )}
                            <p className="mb-1">
                              <span className="font-semibold">City: </span>
                              {selectedOrderAddress.shippingAddress.city || 'N/A'}
                            </p>
                            <p className="mb-1">
                              <span className="font-semibold">State: </span>
                              {selectedOrderAddress.shippingAddress.state || 'N/A'}
                            </p>
                            <p>
                              <span className="font-semibold">PIN Code: </span>
                              {selectedOrderAddress.shippingAddress.pincode || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {selectedOrderAddress.shippingAddress.addressId && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#3B82F6" }}>
                          📍 This is a saved address (ID: {selectedOrderAddress.shippingAddress.addressId.slice(-8)})
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MdLocationOn className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      No shipping address
                    </h3>
                    <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      No shipping address found for this order.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={handleCloseAddressModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Modal */}
        {showPaymentModal && selectedOrderPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    💳 Payment Details - {getOrderId(selectedOrderPayment)}
                  </h3>
                  <p className="text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                    Complete payment information for this order
                  </p>
                </div>
                <button
                  onClick={handleClosePaymentModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <AiOutlineClose className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {selectedOrderPayment.paymentMethod ? (
                  <div className="space-y-6">
                    {/* Payment Method & Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        Payment Overview
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center">
                            <span className="mr-2 text-2xl">{getPaymentMethodIcon(selectedOrderPayment.paymentMethod)}</span>
                            <div>
                              <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                                Payment Method
                              </p>
                              <p className="text-lg font-bold capitalize mt-1" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                                {selectedOrderPayment.paymentMethod}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            Payment Status
                          </p>
                          <div className={`inline-flex items-center px-3 py-2 mt-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedOrderPayment.paymentStatus, selectedOrderPayment.paymentMethod)}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                            <span className="capitalize">
                              {selectedOrderPayment.paymentStatus || 'pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Amount */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            Total Amount:
                          </span>
                          <span className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            {formatPrice(selectedOrderPayment.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Razorpay Details (if applicable) */}
                    {selectedOrderPayment.paymentMethod === 'razorpay' && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="text-lg font-semibold mb-4 flex items-center" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          <span className="mr-2">💳</span>
                          Razorpay Transaction Details
                        </h4>
                        <div className="space-y-4">
                          {/* Payment ID */}
                          {selectedOrderPayment.razorpayPaymentId && (
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                                💳 Payment ID
                              </p>
                              <p className="text-base font-mono mt-1 bg-gray-100 px-3 py-2 rounded" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                                {selectedOrderPayment.razorpayPaymentId}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedOrderPayment.razorpayPaymentId)
                                  showSuccess('Payment ID copied to clipboard!')
                                }}
                                className="text-xs mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                              >
                                📋 Copy Payment ID
                              </button>
                            </div>
                          )}
                          
                          {/* Order ID */}
                          {selectedOrderPayment.razorpayOrderId && (
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                                🏷️ Razorpay Order ID
                              </p>
                              <p className="text-base font-mono mt-1 bg-gray-100 px-3 py-2 rounded" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                                {selectedOrderPayment.razorpayOrderId}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedOrderPayment.razorpayOrderId)
                                  showSuccess('Razorpay Order ID copied to clipboard!')
                                }}
                                className="text-xs mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                              >
                                📋 Copy Order ID
                              </button>
                            </div>
                          )}
                          
                          {/* Transaction Date */}
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                              📅 Transaction Date
                            </p>
                            <p className="text-base mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              {new Date(selectedOrderPayment.createdAt).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {new Date(selectedOrderPayment.createdAt).toLocaleTimeString('en-IN')}
                            </p>
                          </div>
                          
                          {/* Success Message */}
                          {selectedOrderPayment.paymentStatus === 'paid' && (
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <div className="flex items-center">
                                <MdDone className="w-5 h-5 mr-2 text-green-600" />
                                <div>
                                  <p className="text-sm font-semibold text-green-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                    ✅ Payment Successful
                                  </p>
                                  <p className="text-xs text-green-700 mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                    Payment has been verified and processed successfully
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* COD Details (if applicable) */}
                    {selectedOrderPayment.paymentMethod === 'cod' && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="text-lg font-semibold mb-3 flex items-center" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          <span className="mr-2">💵</span>
                          Cash on Delivery
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                              💰 Amount to Collect
                            </p>
                            <p className="text-2xl font-bold mt-1" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                              {formatPrice(selectedOrderPayment.totalAmount)}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                              📋 Collection Status
                            </p>
                            <div className={`inline-flex items-center px-3 py-2 mt-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedOrderPayment.paymentStatus, selectedOrderPayment.paymentMethod)}`} style={{ fontFamily: "Montserrat, sans-serif" }}>
                              <span className="capitalize">
                                {selectedOrderPayment.paymentStatus === 'pending' ? 'To be collected on delivery' : selectedOrderPayment.paymentStatus}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <p className="text-xs font-medium text-orange-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                              ⚠️ Note: Cash payment will be collected at the time of delivery
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Email (if provided) */}
                    {selectedOrderPayment.customerEmail && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          📧 Customer Email
                        </h4>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-base" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {selectedOrderPayment.customerEmail}
                          </p>
                          <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Order confirmation email sent to this address
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Order Meta Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold mb-3" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        📊 Order Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            🏷️ Our Order ID
                          </p>
                          <p className="text-base font-mono mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            {getOrderId(selectedOrderPayment)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            📦 Total Items
                          </p>
                          <p className="text-base font-bold mt-1" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            {selectedOrderPayment.items?.length || 0} item{selectedOrderPayment.items?.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* No Payment Info */}
                    {!selectedOrderPayment.razorpayPaymentId && !selectedOrderPayment.razorpayOrderId && selectedOrderPayment.paymentMethod !== 'cod' && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm font-medium text-yellow-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          ⚠️ No detailed payment information available for this order
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MdPayment className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      No payment information
                    </h3>
                    <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      No payment information found for this order.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={handleClosePaymentModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
