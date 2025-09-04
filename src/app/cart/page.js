"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import CartItem from "../../components/CartItem"
import CartSummary from "../../components/CartSummary"
import { useCart } from "../../contexts/CartContext"
import Link from "next/link"

export default function CartPage() {
  const { data: session, status } = useSession()
  const { items, clearCart, getCartTotal, getCartItemsCount, isLoggedIn } = useCart()
  const [stockIssues, setStockIssues] = useState([])
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status])

  // Check for stock issues - moved to top
  useEffect(() => {
    const issues = items.filter(item => item.quantity > item.stock)
    setStockIssues(issues)
  }, [items])

  // Show loading spinner while checking authentication
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "#5A0117" }}></div>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Redirect if not logged in
  if (status === "unauthenticated" || !isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <svg className="mx-auto h-24 w-24 opacity-50" fill="none" stroke="#8C6141" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Access Restricted
            </h1>
            <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Please login to access your cart.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                Login
              </Link>
              <Link
                href="/products"
                className="inline-block px-6 py-3 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity text-center"
                style={{
                  borderColor: "#8C6141",
                  color: "#8C6141",
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Browse Products
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Block admin access to cart
  if (session?.user?.role === "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <svg className="mx-auto h-24 w-24 opacity-50" fill="none" stroke="#8C6141" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Admin Access Restricted
            </h1>
            <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Administrators cannot access the shopping cart. Please use the admin dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/admindashboard"
                className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                Go to Admin Dashboard
              </Link>
              <Link
                href="/products"
                className="inline-block px-6 py-3 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity text-center"
                style={{
                  borderColor: "#8C6141",
                  color: "#8C6141",
                  fontFamily: "Montserrat, sans-serif",
                }}
              >
                Browse Products
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleCheckout = () => {
    // Prevent checkout if there are stock issues
    if (stockIssues.length > 0) {
      alert('Please resolve stock issues before checkout')
      return
    }
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Shopping Cart
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Review your items before checkout
            </p>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-8">
                <svg className="mx-auto h-24 w-24 opacity-50" fill="none" stroke="#8C6141" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Your cart is empty
              </h2>
              <p className="text-lg mb-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Looks like you have not added any items to your cart yet.
              </p>
              <Link
                href="/products"
                className="inline-block px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        Cart Items ({items.length})
                      </h2>
                      <p className="text-xs sm:text-sm mt-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        {getCartItemsCount()} total items • ₹{getCartTotal().toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={clearCart}
                      className="text-xs sm:text-sm text-red-600 hover:text-red-800 transition-colors px-3 py-1 border border-red-200 rounded-md"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      Clear Cart
                    </button>
                  </div>
                  
                  {/* Stock Issues Alert */}
                  {stockIssues.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <h3 className="text-red-800 font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                          Stock Issues Found
                        </h3>
                      </div>
                      <p className="text-red-700 text-sm mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        The following items have quantity issues:
                      </p>
                      <ul className="text-red-700 text-sm space-y-1">
                        {stockIssues.map((item, index) => (
                          <li key={index} style={{ fontFamily: "Montserrat, sans-serif" }}>
                            • <strong>{item.name}</strong>: Requested {item.quantity}, Available {item.stock}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    {items.map((item) => (
                      <CartItem key={item._id} item={item} />
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <Link
                        href="/products"
                        className="inline-block px-6 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity text-center"
                        style={{
                          borderColor: "#8C6141",
                          color: "#8C6141",
                          fontFamily: "Montserrat, sans-serif",
                        }}
                      >
                        Continue Shopping
                      </Link>
                      
                      {/* Quick Cart Stats */}
                      <div className="flex flex-col sm:flex-row gap-4 text-sm">
                        <div className="text-center sm:text-right">
                          <span className="font-medium" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                            Items: {getCartItemsCount()}
                          </span>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className="font-bold text-lg" style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}>
                            Total: ₹{getCartTotal().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <CartSummary onCheckout={handleCheckout} />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
