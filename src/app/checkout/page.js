"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import CartSummary from "../../components/CartSummary"
import RazorpayButton from "../../components/RazorpayButton"
import AddressSelector from "../../components/AddressSelector"
import CouponSection from "../../components/CouponSection"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { useSession } from "next-auth/react"
import { useToast } from "../../contexts/ToastContext"
import { useNotification } from "../../contexts/NotificationContext"

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCart()
  const { data: session } = useSession()
  const { user: authUser, isAuthenticated: customAuth, token: authToken } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  const { showNotification } = useNotification()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [scriptLoadTimeout, setScriptLoadTimeout] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  
  const currentUser = session?.user || authUser
  const isUserAuthenticated = (session?.status === "authenticated") || customAuth
  
  const [formData, setFormData] = useState({
    // Customer Information
    name: "",
    email: "",
    phone: "",
    // Manual Address (fallback)
    address: "",
    city: "",
    state: "",
    pincode: "",
    // Payment Information
    paymentMethod: "cod",
  })
  
  // Check if Razorpay script is already loaded or set timeout
  useEffect(() => {
    // Check if Razorpay is already available (cached)
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true)
      return
    }

    // Set timeout for script loading (5 seconds)
    const timeout = setTimeout(() => {
      if (!razorpayLoaded) {
        setScriptLoadTimeout(true)
        // Try to check again if Razorpay is available
        if (typeof window !== 'undefined' && window.Razorpay) {
          setRazorpayLoaded(true)
          setScriptLoadTimeout(false)
        }
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  // Load user profile data for authenticated users
  useEffect(() => {
    if (!isUserAuthenticated || !currentUser) return
    
    const fetchUserProfile = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (authToken && authToken !== 'nextauth_session') {
          headers.Authorization = `Bearer ${authToken}`
        }

        const response = await fetch('/api/user/profile', { headers })
        const data = await response.json()

        if (data.success) {
          setFormData(prev => ({
            ...prev,
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || ""
          }))
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    
    fetchUserProfile()
  }, [isUserAuthenticated, currentUser, authToken])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const calculateTotal = () => {
    const subtotal = getCartTotal()
    const shipping = 0 // Always free shipping
    // No GST calculation - tax is already included in product prices
    return subtotal + shipping
  }

  const getFinalTotal = () => {
    if (appliedCoupon) {
      return appliedCoupon.discount.finalAmount
    }
    return calculateTotal()
  }

  const handleCouponApply = (couponData) => {
    setAppliedCoupon(couponData)
    showSuccess(`🎉 Coupon ${couponData.coupon.code} applied! You saved ₹${couponData.discount.discountAmount}`)
  }

  const handleCouponRemove = () => {
    setAppliedCoupon(null)
    showSuccess('Coupon removed')
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address)
    setShowManualForm(false)
  }
  
  const handleManualFormToggle = (show) => {
    setShowManualForm(show)
    if (show) {
      setSelectedAddress(null)
    }
  }
  
  const getShippingAddress = () => {
    if (selectedAddress) {
      return {
        name: formData.name,
        address: selectedAddress.street || '',
        city: selectedAddress.city,
        state: selectedAddress.state || '',
        pincode: selectedAddress.pinCode || '',
        phone: formData.phone,
        addressId: selectedAddress._id // Include address ID for reference
      }
    } else {
      return {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone: formData.phone
      }
    }
  }
  
  const validateForm = () => {
    if (!formData.name.trim()) {
      showError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      showError('Email is required')
      return false
    }
    if (!formData.phone.trim()) {
      showWarning('📞 Mobile number is mandatory for delivery contact. Please provide your contact number to ensure smooth delivery.')
      return false
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[0-9]{10,15}$/
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      showError('Please enter a valid mobile number (10-15 digits)')
      return false
    }
    
    if (selectedAddress) {
      // Using saved address, only need customer details
      return true
    } else if (showManualForm) {
      // Using manual address form
      if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
        showError('All address fields are required')
        return false
      }
      return true
    } else {
      showError('Please select an address or enter address manually')
      return false
    }
  }

  const handleCODOrder = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      const orderData = {
        items: items.map((item) => {
          console.log('🛒 CART ITEM MAPPING:', {
            itemId: item._id,
            itemType: item.itemType,
            isOption: item.isOption,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            productId: item.product?._id,
            productOptionId: item.productOptionId,
            size: item.size,
            color: item.color,
            fullItem: item
          })
          
          // For product options (from cart with isOption: true)
          if (item.isOption && item.productOptionId) {
            return {
              productId: item.productOption?._id || item.productOptionId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              itemType: 'productOption',
              size: item.size,
              color: item.color
            }
          }
          
          // For main products
          return {
            productId: item.product?._id || item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            itemType: 'product'
          }
        }),
        totalAmount: getFinalTotal(),
        originalAmount: appliedCoupon ? calculateTotal() : null,
        discountAmount: appliedCoupon ? appliedCoupon.discount.discountAmount : 0,
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : null,
        couponId: appliedCoupon ? appliedCoupon.coupon._id : null,
        customerEmail: formData.email,
        userId: currentUser?._id || currentUser?.id, // Add userId if user is logged in
        shippingAddress: getShippingAddress(),
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "pending",
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        clearCart()
        showSuccess('🎉 Order placed successfully! You will pay on delivery.')
        router.push(`/order-confirmation?orderId=${data.orderId}`)
      } else {
        showError('❌ Error placing order: ' + data.error)
      }
    } catch (error) {
      console.error("Error placing order:", error)
      showError('❌ Error placing order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRazorpaySuccess = (orderId) => {
    clearCart()
    showSuccess('💳 Payment successful! Your order has been confirmed.')
    router.push(`/order-confirmation?orderId=${orderId}`)
  }

  const handleRazorpayError = (error) => {
    showError('💳 Payment failed: ' + error)
  }

  const getCartItems = () => items.map((item) => {
    console.log('🎁 RAZORPAY CART ITEM MAPPING:', {
      itemId: item._id,
      itemType: item.itemType,
      isOption: item.isOption,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      productId: item.product?._id,
      productOptionId: item.productOptionId,
      size: item.size,
      color: item.color
    })
    
    // For product options (from cart with isOption: true)
    if (item.isOption && item.productOptionId) {
      return {
        productId: item.productOption?._id || item.productOptionId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemType: 'productOption',
        size: item.size,
        color: item.color
      }
    }
    
    // For main products
    return {
      productId: item.product?._id || item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      itemType: 'product'
    }
  })
  
  const getOrderData = () => ({
    customerEmail: formData.email,
    userId: currentUser?._id || currentUser?.id,
    shippingAddress: getShippingAddress(),
  })

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Your cart is empty
            </h1>
            <p className="mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Add some items to your cart before checkout.
            </p>
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => {
          setRazorpayLoaded(true)
          setScriptLoadTimeout(false)
        }}
        onError={() => {
          console.error('Failed to load Razorpay script')
          setScriptLoadTimeout(true)
        }}
        strategy="lazyOnload"
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Checkout
              </h1>
              <p className="mt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Complete your order
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleCODOrder} className="space-y-8">
                  {/* Customer Information */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Customer Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                        >
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                        >
                          Phone Number * 
                          <span className="text-xs font-normal text-gray-600">(Required for delivery contact)</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your mobile number (e.g., +91 8876543910)"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                          style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                        />
                        <p className="mt-1 text-xs" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                          📱 We will use this number to coordinate delivery with you
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Address Selector */}
                  <AddressSelector
                    selectedAddress={selectedAddress}
                    onAddressSelect={handleAddressSelect}
                    onManualAddress={handleManualFormToggle}
                    showManualForm={showManualForm}
                    manualFormData={formData}
                    onManualFormChange={handleInputChange}
                  />

                  {/* Payment Method */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Payment Method
                    </h2>

                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === "cod"}
                          onChange={handleInputChange}
                          className="text-red-600"
                        />
                        <div>
                          <span style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            Cash on Delivery (COD)
                          </span>
                          <p className="text-sm" style={{ color: "#8C6141" }}>
                            Pay when your order is delivered
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={formData.paymentMethod === "razorpay"}
                          onChange={handleInputChange}
                          className="text-red-600"
                        />
                        <div>
                          <span style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            Pay Online (Razorpay)
                          </span>
                          <p className="text-sm" style={{ color: "#8C6141" }}>
                            Credit/Debit Card, UPI, Net Banking, Wallets
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-4">
                    {formData.paymentMethod === "cod" ? (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        {loading ? "Placing Order..." : "Place Order (COD)"}
                      </button>
                    ) : (
                      <div className="w-full">
                        {razorpayLoaded ? (
                          <RazorpayButton
                            cartItems={getCartItems()}
                            orderData={{
                              ...getOrderData(),
                              totalAmount: getFinalTotal(),
                              originalAmount: appliedCoupon ? calculateTotal() : null,
                              discountAmount: appliedCoupon ? appliedCoupon.discount.discountAmount : 0,
                              couponCode: appliedCoupon ? appliedCoupon.coupon.code : null,
                              couponId: appliedCoupon ? appliedCoupon.coupon._id : null
                            }}
                            appliedCoupon={appliedCoupon}
                            finalAmount={getFinalTotal()}
                            onSuccess={handleRazorpaySuccess}
                            onError={handleRazorpayError}
                          />
                        ) : scriptLoadTimeout ? (
                          <div className="w-full space-y-3">
                            <button
                              onClick={() => {
                                // Manual retry
                                if (typeof window !== 'undefined' && window.Razorpay) {
                                  setRazorpayLoaded(true)
                                  setScriptLoadTimeout(false)
                                } else {
                                  showError('Payment gateway failed to load. Please refresh the page or use COD.')
                                }
                              }}
                              className="w-full py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: "#F59E0B", fontFamily: "Montserrat, sans-serif" }}
                            >
                              🔄 Retry Payment Gateway
                            </button>
                            <p className="text-center text-sm" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                              Having trouble? Use Cash on Delivery instead.
                            </p>
                          </div>
                        ) : (
                          <button
                            disabled={true}
                            className="w-full py-4 text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                            style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                          >
                            Loading Payment Gateway...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                {/* Coupon Section */}
                <CouponSection
                  cartItems={getCartItems()}
                  orderAmount={calculateTotal()}
                  onCouponApply={handleCouponApply}
                  onCouponRemove={handleCouponRemove}
                  appliedCoupon={appliedCoupon}
                />
                
                <CartSummary 
                  showCheckoutButton={false} 
                  appliedCoupon={appliedCoupon}
                  finalTotal={getFinalTotal()}
                />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
