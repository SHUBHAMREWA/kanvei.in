"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "./ToastContext"

const WishlistContext = createContext()

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}

export function WishlistProvider({ children }) {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (session?.user?.id) {
      fetchWishlist()
    } else {
      setWishlist([])
    }
  }, [session?.user?.id])

  const fetchWishlist = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/wishlist?userId=${session.user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setWishlist(data.wishlist || [])
      } else {
        console.error("Failed to fetch wishlist:", data.error)
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const toggleWishlist = async (product) => {
    if (!session?.user?.id) {
      showToast("Please login to add items to wishlist", "error")
      return
    }

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product._id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.action === "added") {
          setWishlist(prev => [...prev, { productId: product, userId: session.user.id }])
          showToast("Added to wishlist", "success")
        } else {
          setWishlist(prev => prev.filter(item => item.productId && item.productId._id !== product._id))
          showToast("Removed from wishlist", "success")
        }
      } else {
        showToast(data.error || "Failed to update wishlist", "error")
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      showToast("Error updating wishlist", "error")
    }
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.productId && item.productId._id === productId)
  }

  const getWishlistCount = () => {
    return wishlist.length
  }

  const clearWishlist = async () => {
    if (!session?.user?.id) return

    try {
      // Since there's no bulk delete endpoint, we'll clear the local state
      // and let the next fetch update it properly
      setWishlist([])
      showToast("Wishlist cleared", "success")
    } catch (error) {
      console.error("Error clearing wishlist:", error)
      showToast("Error clearing wishlist", "error")
    }
  }

  const value = {
    wishlist,
    loading,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    clearWishlist,
    fetchWishlist,
    isLoggedIn: !!session?.user?.id
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}
