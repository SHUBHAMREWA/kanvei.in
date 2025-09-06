"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useAuth } from "./AuthContext"
import { useNotification } from "./NotificationContext"

const CartContext = createContext()

export function CartProvider({ children }) {
  const { data: session, status } = useSession()
  const { user: authUser, isAuthenticated: customAuth, token: authToken } = useAuth()
  const { showSuccess, showError, showWarning } = useNotification()
  const [cartData, setCartData] = useState({ items: [], totalItems: 0, totalAmount: 0 })
  
  const [loading, setLoading] = useState(false)

  // Determine if user is logged in via any method
  const isUserLoggedIn = (status === "authenticated" && session?.user?.id) || (customAuth && authUser?._id)
  const currentUserId = session?.user?.id || authUser?._id

  // Fetch cart from database
  const fetchCart = useCallback(async () => {
    if (!currentUserId) return
    
    try {
      setLoading(true)
      // Set up headers for custom auth
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }
      
      const response = await fetch('/api/cart', { headers })
      const data = await response.json()
      
      if (response.ok) {
        setCartData(data.cart || { items: [], totalItems: 0, totalAmount: 0 })
      } else {
        console.error('Failed to fetch cart:', data.error)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, authToken])

  // Load cart from database when user logs in
  useEffect(() => {
    if (isUserLoggedIn && currentUserId) {
      fetchCart()
    } else if (!isUserLoggedIn) {
      setCartData({ items: [], totalItems: 0, totalAmount: 0 })
    }
  }, [session, status, authUser, customAuth, isUserLoggedIn, currentUserId, fetchCart])

  // Add item to cart (DB operation)
  const addToCart = useCallback(async (product, quantity = 1, productOption = null) => {
    // Check if user is logged in via any method
    if (!isUserLoggedIn) {
      showWarning("Please login to add items to cart")
      return false
    }

    try {
      setLoading(true)
      
      const payload = {
        quantity
      }
      
      if (productOption) {
        payload.productOptionId = productOption.id || productOption._id
      } else {
        payload.productId = product._id
      }

      // Set up headers for custom auth
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        setCartData(data.cart || { items: [], totalItems: 0, totalAmount: 0 })
        
        // Show success notification when adding to cart
        if (data.updated) {
          showSuccess(data.message || 'Item quantity updated in cart!')
        } else {
          showSuccess('Item added to cart successfully! 🛍️')
        }
        return true
      } else {
        showError(data.error || 'Failed to add item to cart')
        return false
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      showError('Failed to add item to cart')
      return false
    } finally {
      setLoading(false)
    }
  }, [isUserLoggedIn, authToken, showSuccess, showError, showWarning])

  // Remove item from cart (DB operation)
  const removeFromCart = useCallback(async (cartItemId) => {
    if (!isUserLoggedIn) {
      showWarning("Please login to modify cart")
      return false
    }

    try {
      setLoading(true)
      // Set up headers for custom auth
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }
      
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE',
        headers
      })

      const data = await response.json()

      if (response.ok) {
        setCartData(data.cart || { items: [], totalItems: 0, totalAmount: 0 })
        
        showSuccess('Item removed from cart')
        return true
      } else {
        showError(data.error || 'Failed to remove item')
        return false
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      showError('Failed to remove item')
      return false
    } finally {
      setLoading(false)
    }
  }, [isUserLoggedIn, authToken, showSuccess, showError, showWarning])

  // Update quantity (DB operation)
  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (!isUserLoggedIn) {
      showWarning("Please login to modify cart")
      return false
    }

    // Validate quantity
    if (quantity === null || quantity === undefined || typeof quantity !== 'number') {
      console.error('Invalid quantity provided:', { quantity, type: typeof quantity })
      showError('Invalid quantity value')
      return false
    }

    try {
      setLoading(true)
      // Set up headers for custom auth
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }
      
      console.log('🔄 Updating cart quantity:', { cartItemId, quantity })
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ cartItemId, quantity })
      })

      const data = await response.json()
      console.log('🌐 API Response:', { status: response.status, data })

      if (response.ok) {
        setCartData(data.cart || { items: [], totalItems: 0, totalAmount: 0 })
        
        if (quantity === 0) {
          showSuccess('Item removed from cart')
        } else {
          showSuccess('Quantity updated')
        }
        return true
      } else {
        console.error('❌ API Error:', { 
          status: response.status, 
          statusText: response.statusText, 
          error: data.error,
          fullResponse: data 
        })
        showError(data.error || 'Failed to update quantity')
        return false
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      showError('Failed to update quantity')
      return false
    } finally {
      setLoading(false)
    }
  }, [isUserLoggedIn, authToken, showSuccess, showError, showWarning])

  // Clear cart (DB operation)
  const clearCart = useCallback(async () => {
    if (!isUserLoggedIn) {
      showWarning("Please login to clear cart")
      return false
    }

    try {
      setLoading(true)
      // Set up headers for custom auth
      const headers = { 'Content-Type': 'application/json' }
      if (authToken && authToken !== 'nextauth_session') {
        headers.Authorization = `Bearer ${authToken}`
      }
      
      const response = await fetch('/api/cart?clearAll=true', {
        method: 'DELETE',
        headers
      })

      const data = await response.json()

      if (response.ok) {
        setCartData({ items: [], totalItems: 0, totalAmount: 0 })
        showSuccess('Cart cleared successfully')
        return true
      } else {
        showError(data.error || 'Failed to clear cart')
        return false
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      showError('Failed to clear cart')
      return false
    } finally {
      setLoading(false)
    }
  }, [isUserLoggedIn, authToken, showSuccess, showError, showWarning])

  // Helper functions
  const getCartTotal = useCallback(() => {
    return cartData.totalAmount || 0
  }, [cartData.totalAmount])

  const getCartItemsCount = useCallback(() => {
    return cartData.totalItems || 0
  }, [cartData.totalItems])

  // Check if item is in cart
  const isInCart = useCallback((productId, productOptionId = null) => {
    if (!cartData.items || !Array.isArray(cartData.items)) {
      return { inCart: false, quantity: 0 }
    }
    
    const item = cartData.items.find(item => {
      if (productOptionId) {
        return item.productOptionId === productOptionId || item.productOption?._id === productOptionId
      } else {
        // Check for regular product items
        return (
          (item.product?._id === productId && item.itemType === 'product') ||
          (item.product?._id === productId && !item.isOption)
        )
      }
    })
    
    return {
      inCart: !!item,
      quantity: item?.quantity || 0,
      cartItemId: item?._id
    }
  }, [cartData.items])

  return (
    <CartContext.Provider
      value={{
        items: cartData.items || [],
        totalItems: cartData.totalItems || 0,
        totalAmount: cartData.totalAmount || 0,
        loading,
        isLoggedIn: isUserLoggedIn,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        isInCart,
        refetchCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
