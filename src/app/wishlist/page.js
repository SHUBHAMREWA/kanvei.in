"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import ProductCard from "../../components/ProductCard"
import { useWishlist } from "../../contexts/WishlistContext"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useToast } from "../../contexts/ToastContext"
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai"
import { MdDeleteOutline, MdShoppingCart, MdShoppingCartOutlined } from "react-icons/md"
import { FaCheckCircle } from "react-icons/fa"

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingItems, setRemovingItems] = useState(new Set())
  const [addingToCart, setAddingToCart] = useState(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [itemToRemove, setItemToRemove] = useState(null)
  const [notification, setNotification] = useState(null)
  const { user, isAuthenticated } = useAuth()
  const { wishlist: contextWishlist, fetchWishlist, loading: wishlistLoading } = useWishlist()
  const { addToCart } = useCart()
  const { showSuccess, showError, showInfo } = useToast()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // If admin is logged in, redirect to admin dashboard (no wishlist for admin)
  if (user?.role === "admin") {
    if (typeof window !== "undefined") {
      router.replace("/admindashboard")
    }
    return null
  }

  // Use wishlist from context instead of local state
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchWishlist()
    }
    setLoading(false)
  }, [user, isAuthenticated])

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    if (!user) {
      showInfo("Please login to manage your wishlist", 4000)
      return
    }

    setRemovingItems(prev => new Set([...prev, productId]))

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, productId }),
      })

      const data = await res.json()
      if (data.success) {
        if (data.action === "removed") {
          setWishlist(prev => prev.filter(item => item.productId._id !== productId))
          showSuccess("Removed from wishlist 💔", 3000)
        }
      } else {
        showError(data.error || "Failed to remove from wishlist", 4000)
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      showError("Failed to remove from wishlist. Please try again.", 4000)
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  // Handle adding item to cart
  const handleAddToCart = async (product) => {
    if (!user) {
      showInfo("Please login to add items to cart", 4000)
      return
    }

    try {
      await addToCart(product, 1)
      showSuccess(`Added ${product.name} to cart 🛒`, 4000)
      
      // Refresh wishlist to update cart status
      fetchWishlist()
    } catch (error) {
      console.error("Error adding to cart:", error)
      showError("Failed to add item to cart. Please try again.", 4000)
    }
  }

  // Handle moving item to cart and removing from wishlist
  const handleMoveToCart = async (item) => {
    if (!user) {
      alert("Please login to manage your cart")
      return
    }

    // Add to cart first
    await addToCart(item.productId, 1)
    
    // Then remove from wishlist
    await handleRemoveFromWishlist(item.productId._id)
    alert(`Moved ${item.productId.name} to cart`)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <AiOutlineHeart className="w-24 h-24 mx-auto mb-6 text-gray-400" />
            <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Login Required
            </h1>
            <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              You need to be logged in to view your wishlist.
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

      <main className="flex-1">
        {/* Page Header */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-white" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-7xl mx-auto text-center">
            <AiFillHeart className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              My Wishlist
            </h1>
            <p className="text-xl opacity-90" style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>
              Your favorite products saved for later
            </p>
          </div>
        </section>

        {/* Wishlist Items */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
                ))}
              </div>
            ) : contextWishlist.length > 0 ? (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      {contextWishlist.length} Item{contextWishlist.length !== 1 ? "s" : ""}
                    </h2>
                    <p className="text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                      Items in your wishlist
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="px-4 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
                    style={{
                      borderColor: "#5A0117",
                      color: "#5A0117",
                      fontFamily: "Montserrat, sans-serif",
                    }}
                  >
                    Browse More Products
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {contextWishlist.filter(item => item.productId).map((item) => (
                    <ProductCard key={item._id} product={item.productId} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <AiOutlineHeart className="w-32 h-32 mx-auto mb-6 text-gray-300" />
                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Your wishlist is empty
                </h3>
                <p className="text-lg mb-8 max-w-md mx-auto" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Discover amazing products and save your favorites for later by clicking the heart icon on any product.
                </p>
                <Link
                  href="/products"
                  className="inline-block px-8 py-4 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
