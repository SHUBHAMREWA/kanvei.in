"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import ProductCard from "../../components/ProductCard"
import { useWishlist } from "../../contexts/WishlistContext"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { useToast } from "../../contexts/ToastContext"
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai"

export default function WishlistPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const {
    wishlist: contextWishlist = [],
    fetchWishlist,
    loading: wishlistLoading,
    // optional if your context exposes it
    removeFromWishlist,
  } = useWishlist()
  const { addToCart } = useCart()
  const { showSuccess, showError, showInfo } = useToast()

  // 1) All hooks are declared before any early returns.
  // Handle redirects for unauthenticated users & admin users
  useEffect(() => {
    // If explicitly not authenticated, go to login
    if (isAuthenticated === false) {
      router.push("/login")
      return
    }
    // If admin logs in, send them to admin dashboard
    if (user?.role === "admin") {
      router.replace("/admindashboard")
    }
  }, [isAuthenticated, user?.role, router])

  // 2) Fetch wishlist whenever a real user session is available
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchWishlist()
    }
  }, [user, isAuthenticated, fetchWishlist])

  // Remove an item from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    if (!user) {
      showInfo("Please login to manage your wishlist", 4000)
      return
    }

    try {
      if (typeof removeFromWishlist === "function") {
        await removeFromWishlist(productId)
      } else {
        // fallback if context doesn't provide remover
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, productId }),
        })
        const data = await res.json()
        if (!data?.success || data?.action !== "removed") {
          throw new Error(data?.error || "Failed to remove from wishlist")
        }
      }

      // refresh list from server/context so UI stays in sync
      await fetchWishlist()
      showSuccess("Removed from wishlist 💔", 3000)
    } catch (err) {
      console.error("Error removing from wishlist:", err)
      showError("Failed to remove from wishlist. Please try again.", 4000)
    }
  }

  // Add item to cart
  const handleAddToCart = async (product) => {
    if (!user) {
      showInfo("Please login to add items to cart", 4000)
      return
    }
    try {
      await addToCart(product, 1)
      showSuccess(`Added ${product?.name || "item"} to cart 🛒`, 4000)
      await fetchWishlist() // refresh to reflect any cart flags
    } catch (err) {
      console.error("Error adding to cart:", err)
      showError("Failed to add item to cart. Please try again.", 4000)
    }
  }

  // Move item to cart (add then remove)
  const handleMoveToCart = async (item) => {
    if (!user) {
      showInfo("Please login to manage your cart", 4000)
      return
    }
    try {
      await addToCart(item.productId, 1)
      await handleRemoveFromWishlist(item.productId._id)
      showSuccess(`Moved ${item.productId?.name || "item"} to cart`, 4000)
    } catch (err) {
      console.error("Error moving to cart:", err)
      showError("Failed to move item to cart. Please try again.", 4000)
    }
  }

  // If there is no user yet (e.g., first paint) show the login-required view.
  // We do not early-return before hooks; hooks are all above.
  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md mx-auto text-center">
            <AiOutlineHeart className="w-24 h-24 mx-auto mb-6 text-gray-400" />
            <h1
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
            >
              Login Required
            </h1>
            <p
              className="text-lg mb-6"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}
            >
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
        <section
          className="py-16 px-4 sm:px-6 lg:px-8 text-white"
          style={{ backgroundColor: "#5A0117" }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <AiFillHeart className="w-16 h-16 mx-auto mb-4" />
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Sugar, serif" }}
            >
              My Wishlist
            </h1>
            <p
              className="text-xl opacity-90"
              style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
            >
              Your favorite products saved for later
            </p>
          </div>
        </section>

        {/* Wishlist Items */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {wishlistLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
                ))}
              </div>
            ) : contextWishlist.length > 0 ? (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
                    >
                      {contextWishlist.length} Item{contextWishlist.length !== 1 ? "s" : ""}
                    </h2>
                    <p
                      className="text-lg"
                      style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}
                    >
                      Items in your wishlist
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="px-4 py-2 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
                    style={{ borderColor: "#5A0117", color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                  >
                    Browse More Products
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {contextWishlist
                    .filter((item) => item?.productId)
                    .map((item) => (
                      <div key={item._id}>
                        <ProductCard product={item.productId} />
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <AiOutlineHeart className="w-32 h-32 mx-auto mb-6 text-gray-300" />
                <h3
                  className="text-3xl font-bold mb-4"
                  style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
                >
                  Your wishlist is empty
                </h3>
                <p
                  className="text-lg mb-8 max-w-md mx-auto"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}
                >
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
