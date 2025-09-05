"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { useAuth } from "../../contexts/AuthContext"
import { useSession } from "next-auth/react"
import { useToast } from "../../contexts/ToastContext"
import Link from "next/link"
import { 
  AiOutlineShopping, 
  AiOutlineCalendar, 
  AiOutlineEye, 
  AiOutlineFilter,
  AiOutlineSearch
} from "react-icons/ai"
import { 
  MdLocalShipping, 
  MdDone, 
  MdCancel, 
  MdHourglassEmpty, 
  MdDeliveryDining,
  MdSecurity 
} from "react-icons/md"

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders', icon: AiOutlineShopping, color: '#6B7280' },
  { value: 'pending', label: 'Pending', icon: MdHourglassEmpty, color: '#F59E0B' },
  { value: 'processing', label: 'Processing', icon: MdHourglassEmpty, color: '#F59E0B' },
  { value: 'shipping', label: 'Shipping', icon: MdLocalShipping, color: '#3B82F6' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: MdDeliveryDining, color: '#8B5CF6' },
  { value: 'delivered', label: 'Delivered', icon: MdDone, color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', icon: MdCancel, color: '#EF4444' }
]

export default function OrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { user: authUser, isAuthenticated: customAuth, token: authToken } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  
  const currentUser = session?.user || authUser
  const isUserAuthenticated = (status === "authenticated") || customAuth

  // Check authentication
  useEffect(() => {
    if (status === "loading") return

    if (!isUserAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect admin to dashboard
    if (currentUser?.role === "admin") {
      router.push('/admindashboard')
      return
    }

    setLoading(false)
  }, [status, isUserAuthenticated, currentUser, router])

  // Fetch user orders
  useEffect(() => {
    if (!isUserAuthenticated || !currentUser) return

    const fetchOrders = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (authToken && authToken !== 'nextauth_session') {
          headers.Authorization = `Bearer ${authToken}`
        }

        const userId = currentUser._id || currentUser.id
        
        // Build query parameters
        const params = new URLSearchParams({ userId })
        
        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        
        if (dateFilter !== 'all') {
          params.append('dateFilter', dateFilter)
          if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
            params.append('startDate', customDateRange.start)
            params.append('endDate', customDateRange.end)
          }
        }
        
        const response = await fetch(`/api/orders?${params.toString()}`, { headers })
        const data = await response.json()

        if (data.success) {
          console.log('🚀 FRONTEND API RESPONSE DEBUG:')
          console.log('Total Orders:', data.orders?.length || 0)
          
          // Debug all items in first order
          if (data.orders?.[0]?.items) {
            console.log('First Order Items Count:', data.orders[0].items.length)
            data.orders[0].items.forEach((item, index) => {
              console.log(`\n📦 Item ${index + 1}:`)  
              console.log('  - Name:', item.name)
              console.log('  - ItemType:', item.itemType)
              console.log('  - ProductId:', item.productId?._id)
              console.log('  - Product Name:', item.productId?.name) 
              console.log('  - Images Array:', item.productId?.images)
              console.log('  - Images Count:', item.productId?.images?.length || 0)
              console.log('  - Has Images:', (item.productId?.images?.length || 0) > 0)
              console.log('  - First Image URL:', item.productId?.images?.[0] || 'NO IMAGE')
              console.log('  - Size:', item.productId?.size)
              console.log('  - Color:', item.productId?.color)
              console.log('  - Full Item JSON:', JSON.stringify(item, null, 2))
            })
          }
          setOrders(data.orders || [])
          // Apply client-side search filter after getting API results
          let filtered = data.orders || []
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(order => 
              order._id.toString().toLowerCase().includes(query) ||
              order.items?.some(item => 
                item.name?.toLowerCase().includes(query)
              ) ||
              order.shippingAddress?.name?.toLowerCase().includes(query) ||
              order.shippingAddress?.city?.toLowerCase().includes(query)
            )
          }
          setFilteredOrders(filtered)
        } else {
          showError(data.error || 'Failed to fetch orders')
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        showError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    if (!loading) {
      fetchOrders()
    }
  }, [isUserAuthenticated, currentUser, authToken, loading, showError, statusFilter, dateFilter, customDateRange])

  // Apply client-side search filtering only
  useEffect(() => {
    let filtered = [...orders]

    // Filter by search query (status and date are handled by API)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order => 
        order._id.toString().toLowerCase().includes(query) ||
        order.items?.some(item => 
          item.name?.toLowerCase().includes(query)
        ) ||
        order.shippingAddress?.name?.toLowerCase().includes(query) ||
        order.shippingAddress?.city?.toLowerCase().includes(query)
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery])

  const getStatusInfo = (status) => {
    const statusInfo = ORDER_STATUSES.find(s => 
      s.value === status?.toLowerCase() || s.label.toLowerCase() === status?.toLowerCase()
    )
    return statusInfo || ORDER_STATUSES[1] // Default to processing
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getOrderId = (order) => {
    // Use proper orderId field if available, fallback to formatted _id
    return order.orderId ? `#${order.orderId}` : `#${order._id.toString().slice(-8).toUpperCase()}`
  }

  // Loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#5A0117" }}></div>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>Loading orders...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Not authenticated
  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <MdSecurity className="mx-auto h-24 w-24 opacity-50" style={{ color: "#8C6141" }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Access Restricted
            </h1>
            <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Please login to view your orders.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Login Now
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <AiOutlineShopping className="w-8 h-8" style={{ color: "#5A0117" }} />
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                My Orders
              </h1>
            </div>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Track and manage all your orders
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Filter & Search Your Orders
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "#5A0117" }}>
                  <AiOutlineFilter className="w-4 h-4" />
                  Order Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "#5A0117" }}>
                  <AiOutlineCalendar className="w-4 h-4" />
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7_days">Last 7 Days</option>
                  <option value="2_weeks">Last 2 Weeks</option>
                  <option value="3_weeks">Last 3 Weeks</option>
                  <option value="1_month">Last Month</option>
                  <option value="2_months">Last 2 Months</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: "#5A0117" }}>
                  <AiOutlineSearch className="w-4 h-4" />
                  Search Orders
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order ID, product, address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ focusRingColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setDateFilter('all')
                    setSearchQuery('')
                    setCustomDateRange({ start: '', end: '' })
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
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
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Status: {ORDER_STATUSES.find(s => s.value === statusFilter)?.label}
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Date: {dateFilter === 'custom' ? 'Custom Range' : dateFilter.replace('_', ' ')}
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Search: {searchQuery}
                </span>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Order Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#5A0117" }}>{orders.length}</p>
                <p className="text-sm" style={{ color: "#8C6141" }}>Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => ['pending', 'processing'].includes(o.status?.toLowerCase())).length}
                </p>
                <p className="text-sm" style={{ color: "#8C6141" }}>Processing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status?.toLowerCase() === 'delivered').length}
                </p>
                <p className="text-sm" style={{ color: "#8C6141" }}>Delivered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#5A0117" }}>
                  {filteredOrders.length}
                </p>
                <p className="text-sm" style={{ color: "#8C6141" }}>Showing</p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <AiOutlineShopping className="mx-auto w-16 h-16 mb-4 opacity-30" style={{ color: "#8C6141" }} />
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                {statusFilter === 'all' ? 'No orders found' : `No ${ORDER_STATUSES.find(s => s.value === statusFilter)?.label.toLowerCase()} orders`}
              </h3>
              <p className="mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                {statusFilter === 'all' 
                  ? "You haven't placed any orders yet. Start shopping to see your orders here!" 
                  : "Try changing the filter or search criteria."
                }
              </p>
              {statusFilter === 'all' && (
                <Link
                  href="/products"
                  className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  Start Shopping
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                const StatusIcon = statusInfo.icon

                return (
                  <div key={order._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    {/* Order Header */}
                    <div className="p-6 border-b">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                              Order {getOrderId(order)}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-2 text-sm" style={{ color: "#8C6141" }}>
                                <AiOutlineCalendar className="w-4 h-4" />
                                {formatDate(order.createdAt)}
                              </div>
                              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: statusInfo.color }}>
                                <StatusIcon className="w-4 h-4" />
                                {statusInfo.label}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold" style={{ color: "#5A0117" }}>
                            {formatPrice(order.totalAmount)}
                          </p>
                          <p className="text-sm" style={{ color: "#8C6141" }}>
                            {order.paymentMethod?.toUpperCase()} • {order.items?.length || 0} item(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items?.slice(0, 3).map((item, index) => {
                          console.log(`📦 RENDERING ITEM ${index + 1}:`, {
                            name: item.name,
                            itemType: item.itemType, 
                            productId: item.productId?._id,
                            images: item.productId?.images,
                            imageCount: item.productId?.images?.length || 0,
                            clickHref: item.productId?._id ? (item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`) : 'NO_PRODUCT_ID',
                            hasProductId: !!item.productId?._id,
                            fullItem: item
                          })
                          
                          return (
                          <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            {/* Product Image - Clickable */}
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                              {item.productId?._id ? (
                                <Link 
                                  href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                                  className="block w-full h-full hover:opacity-90 transition-opacity"
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
                                      <AiOutlineShopping className="w-8 h-8" style={{ color: "#8C6141" }} />
                                    </div>
                                  )}
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer" style={{
                                    display: item.productId?.images && item.productId.images.length > 0 ? 'none' : 'flex'
                                  }}>
                                    <AiOutlineShopping className="w-8 h-8" style={{ color: "#8C6141" }} />
                                  </div>
                                </Link>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <AiOutlineShopping className="w-8 h-8" style={{ color: "#8C6141" }} />
                                </div>
                              )}
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1">
                              {item.productId?._id ? (
                                <Link
                                  href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                                  className="font-medium hover:underline cursor-pointer transition-colors text-lg"
                                  style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                                >
                                  {item.name || item.productId?.name}
                                  {item.itemType === 'productOption' && item.productId?.size && item.productId?.color && (
                                    <span className="text-sm font-normal ml-2 text-gray-600">
                                      ({item.productId.size}, {item.productId.color})
                                    </span>
                                  )}
                                </Link>
                              ) : (
                                <h4 className="font-medium text-lg" style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                                  {item.name}
                                  {item.size && item.color && (
                                    <span className="text-sm font-normal ml-2 text-gray-600">
                                      ({item.size}, {item.color})
                                    </span>
                                  )}
                                </h4>
                              )}
                              <p className="text-sm mt-1" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                                Quantity: <span className="font-medium">{item.quantity}</span> • {formatPrice(item.price)} each
                              </p>
                              {item.productId?._id && (
                                <p className="text-xs mt-1 opacity-75" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                                  Click to view {item.itemType === 'productOption' ? 'product option' : 'product'} details
                                </p>
                              )}
                            </div>
                            
                            {/* Price */}
                            <div className="text-right">
                              <p className="font-bold text-lg" style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              <p className="text-xs" style={{ color: "#8C6141" }}>
                                Total
                              </p>
                            </div>
                          </div>
                          )
                        })}
                        
                        {order.items?.length > 3 && (
                          <p className="text-center text-sm py-2" style={{ color: "#8C6141" }}>
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      {/* Shipping Address */}
                      <div className="mt-6 pt-6 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium mb-2" style={{ color: "#5A0117" }}>
                              Shipping Address
                            </h5>
                            <p className="text-sm" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                              {order.shippingAddress?.name}<br />
                              {order.shippingAddress?.address}<br />
                              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
                              Phone: {order.shippingAddress?.phone}
                            </p>
                          </div>
                          
                          <div className="flex items-end justify-end">
                            <Link
                              href={`/orders/${order._id}`}
                              className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                              style={{ borderColor: "#8C6141", color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                            >
                              <AiOutlineEye className="w-4 h-4" />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
