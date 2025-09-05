"use client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Header from "../../../components/shared/Header"
import Footer from "../../../components/shared/Footer"
import { useAuth } from "../../../contexts/AuthContext"
import { useSession } from "next-auth/react"
import { useToast } from "../../../contexts/ToastContext"
import Link from "next/link"
import { 
  AiOutlineShopping, 
  AiOutlineCalendar, 
  AiOutlineArrowLeft,
  AiOutlineUser,
  AiOutlinePhone,
  AiOutlineMail
} from "react-icons/ai"
import { 
  MdLocalShipping, 
  MdDone, 
  MdCancel, 
  MdHourglassEmpty, 
  MdDeliveryDining,
  MdSecurity,
  MdLocationOn,
  MdPayment
} from "react-icons/md"

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: MdHourglassEmpty, color: '#F59E0B', description: 'Your order is being reviewed' },
  { value: 'processing', label: 'Processing', icon: MdHourglassEmpty, color: '#F59E0B', description: 'Your order is being prepared' },
  { value: 'shipping', label: 'Shipping', icon: MdLocalShipping, color: '#3B82F6', description: 'Your order has been shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: MdDeliveryDining, color: '#8B5CF6', description: 'Your order is out for delivery' },
  { value: 'delivered', label: 'Delivered', icon: MdDone, color: '#10B981', description: 'Your order has been delivered' },
  { value: 'cancelled', label: 'Cancelled', icon: MdCancel, color: '#EF4444', description: 'Your order has been cancelled' }
]

export default function OrderDetailPage({ params }) {
  // Unwrap params Promise for Next.js 15+ compatibility
  const resolvedParams = use(params)
  
  const router = useRouter()
  const { data: session, status } = useSession()
  const { user: authUser, isAuthenticated: customAuth, token: authToken } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [notFound, setNotFound] = useState(false)
  
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

  // Fetch order details
  useEffect(() => {
    if (!isUserAuthenticated || !currentUser || !resolvedParams.id) return

    const fetchOrder = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (authToken && authToken !== 'nextauth_session') {
          headers.Authorization = `Bearer ${authToken}`
        }

        const response = await fetch(`/api/orders/${resolvedParams.id}`, { headers })
        const data = await response.json()

        if (data.success) {
          // Verify the order belongs to the current user
          const userId = currentUser._id || currentUser.id
          if (data.order.userId === userId || data.order.customerEmail === currentUser.email) {
            setOrder(data.order)
          } else {
            setNotFound(true)
          }
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (!loading) {
      fetchOrder()
    }
  }, [isUserAuthenticated, currentUser, authToken, loading, resolvedParams.id])

  const getStatusInfo = (status) => {
    const statusInfo = ORDER_STATUSES.find(s => 
      s.value === status?.toLowerCase() || s.label.toLowerCase() === status?.toLowerCase()
    )
    return statusInfo || ORDER_STATUSES[0]
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    // If order has the new orderId field, use it with a # prefix
    if (order?.orderId) {
      return `#${order.orderId}`
    }
    // Fallback to formatting the MongoDB _id (for legacy orders)
    const mongoId = order?._id || order
    return `#${mongoId.toString().slice(-8).toUpperCase()}`
  }

  const calculateSubtotal = () => {
    return order?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
  }

  const getShipping = () => {
    return 0 // Always free shipping
  }

  // No tax calculation - tax is already included in product prices

  // Loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#5A0117" }}></div>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>Loading order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Not found or not authenticated
  if (notFound || !isUserAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <MdSecurity className="mx-auto h-24 w-24 opacity-50" style={{ color: "#8C6141" }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              {!isUserAuthenticated ? "Access Restricted" : "Order Not Found"}
            </h1>
            <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              {!isUserAuthenticated 
                ? "Please login to view order details." 
                : "This order doesn't exist or doesn't belong to you."
              }
            </p>
            <Link
              href={!isUserAuthenticated ? "/login" : "/orders"}
              className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              {!isUserAuthenticated ? "Login Now" : "View All Orders"}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) return null

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/orders"
              className="flex items-center gap-2 text-sm hover:underline"
              style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
            >
              <AiOutlineArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
          </div>

          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Order {getOrderId(order)}
                </h1>
                <div className="flex items-center gap-4 text-sm" style={{ color: "#8C6141" }}>
                  <div className="flex items-center gap-2">
                    <AiOutlineCalendar className="w-4 h-4" />
                    Placed on {formatDate(order.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 font-medium" style={{ color: statusInfo.color }}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </div>
                </div>
                <p className="mt-2 text-sm" style={{ color: "#8C6141" }}>
                  {statusInfo.description}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold mb-1" style={{ color: "#5A0117" }}>
                  {formatPrice(order.totalAmount)}
                </p>
                <p className="text-sm" style={{ color: "#8C6141" }}>
                  {order.paymentMethod?.toUpperCase()} • {order.items?.length || 0} item(s)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Order Items
                </h2>

                <div className="space-y-4">
                  {order.items?.map((item, index) => {
                    // Debug logging for each item
                    console.log(`📦 ORDER DETAIL - RENDERING ITEM ${index + 1}:`, {
                      name: item.name,
                      itemType: item.itemType, 
                      productId: item.productId?._id,
                      images: item.productId?.images,
                      imageCount: item.productId?.images?.length || 0,
                      clickHref: item.productId?._id ? (item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`) : 'NO_PRODUCT_ID',
                      hasProductId: !!item.productId?._id,
                      fullItem: item
                    })
                    
                    // For legacy orders without productId, try to find product by name
                    const hasProductId = item.productId?._id
                    const productName = item.name || item.productId?.name
                    
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                        {/* Product Image - Clickable or Static */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {hasProductId ? (
                            <Link 
                              href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                              className="block w-full h-full hover:opacity-90 transition-opacity"
                            >
                              {item.productId?.images && item.productId.images.length > 0 ? (
                                <img
                                  src={item.productId.images[0]}
                                  alt={productName}
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
                            // Legacy order - no productId reference, show static icon
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300">
                              <div className="text-center">
                                <AiOutlineShopping className="w-8 h-8 mx-auto mb-1" style={{ color: "#8C6141" }} />
                                <p className="text-xs" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>Legacy Order</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          {hasProductId ? (
                            <Link
                              href={item.itemType === 'productOption' ? `/products/option/${item.productId._id}` : `/products/${item.productId?.slug || item.productId._id}`}
                              className="font-medium mb-1 hover:underline cursor-pointer transition-colors inline-block text-lg"
                              style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                            >
                              {productName}
                              {item.itemType === 'productOption' && item.productId?.size && item.productId?.color && (
                                <span className="text-sm font-normal ml-2 text-gray-600">
                                  ({item.productId.size}, {item.productId.color})
                                </span>
                              )}
                            </Link>
                          ) : (
                            <div>
                              <h3 className="font-medium mb-1 text-lg" style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                                {productName}
                              </h3>
                              <p className="text-xs text-orange-600 mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                ⚠️ Legacy order - Product details not available
                              </p>
                            </div>
                          )}
                          <p className="text-sm mb-1" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                            {formatPrice(item.price)} each
                          </p>
                          {hasProductId && (
                            <p className="text-xs opacity-75" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                              Click to view {item.itemType === 'productOption' ? 'product option' : 'product'} details
                            </p>
                          )}
                        </div>
                        
                        {/* Quantity and Price */}
                        <div className="text-right">
                          <p className="font-medium mb-1" style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                            Qty: {item.quantity}
                          </p>
                          <p className="text-lg font-bold" style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#8C6141" }}>Subtotal:</span>
                      <span style={{ color: "#5A0117" }}>{formatPrice(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "#8C6141" }}>Shipping:</span>
                      <span style={{ color: "#5A0117" }}>
                        {getShipping() === 0 ? 'Free' : formatPrice(getShipping())}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ color: "#5A0117" }}>
                      <span>Total:</span>
                      <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Shipping Address */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    <MdLocationOn className="w-5 h-5" />
                    Shipping Address
                  </h3>
                  <div className="space-y-2 text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    <p className="font-medium" style={{ color: "#5A0117" }}>
                      {order.shippingAddress?.name}
                    </p>
                    <p style={{ color: "#8C6141" }}>
                      {order.shippingAddress?.address}
                    </p>
                    <p style={{ color: "#8C6141" }}>
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <AiOutlinePhone className="w-4 h-4" />
                      <span style={{ color: "#8C6141" }}>{order.shippingAddress?.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    <MdPayment className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="space-y-3 text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    <div>
                      <span style={{ color: "#8C6141" }}>Payment Method:</span>
                      <p className="font-medium" style={{ color: "#5A0117" }}>
                        {order.paymentMethod?.toUpperCase() === 'COD' ? 'Cash on Delivery' : order.paymentMethod?.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#8C6141" }}>Payment Status:</span>
                      <p className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#8C6141" }}>Total Amount:</span>
                      <p className="font-bold text-lg" style={{ color: "#5A0117" }}>
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Timeline (Future Enhancement) */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                    Order Status
                  </h3>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${statusInfo.color}10` }}>
                    <StatusIcon className="w-6 h-6" style={{ color: statusInfo.color }} />
                    <div>
                      <p className="font-medium" style={{ color: "#5A0117" }}>
                        {statusInfo.label}
                      </p>
                      <p className="text-xs" style={{ color: "#8C6141" }}>
                        {statusInfo.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-center" style={{ color: "#8C6141" }}>
                      💡 Orders cannot be cancelled once placed.
                      <br />
                      Contact support if you need assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
