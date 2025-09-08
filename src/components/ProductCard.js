"use client"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "../contexts/CartContext"
import { useWishlist } from "../contexts/WishlistContext"
import { useRouter } from "next/navigation" 
import { MdOutlineShoppingCart } from "react-icons/md";

export default function ProductCard({ product }) {
  const { addToCart, isLoggedIn } = useCart()
  const { toggleWishlist, isInWishlist, isLoggedIn: wishlistLoggedIn } = useWishlist()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  
  
  const handleAddToCart = async (e) => {
    e.preventDefault() // Prevent Link navigation
    e.stopPropagation() // Stop event bubbling
    
    if (!isLoggedIn) {
      router.push('/login?redirect=/products')
      return
    }
    
    if (product.stock <= 0) return
    
    setIsAdding(true)
    try {
      const success = await addToCart(product, 1) // Always add 1 item
      if (success) {
        // Redirect to checkout after successful cart addition
        router.push('/checkout')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }
  
  const handleBuyNow = (e) => {
    e.preventDefault() // Prevent Link navigation
    e.stopPropagation() // Stop event bubbling
    
    if (!isLoggedIn) {
      router.push('/login?redirect=/products')
      return
    }
    
    if (product.stock <= 0) return
    
    // Add to cart first, then redirect to cart
    handleAddToCart(e).then(() => {
      router.push('/cart')
    })
  }

  const handleWishlistToggle = async (e) => {
    e.preventDefault() // Prevent Link navigation
    e.stopPropagation() // Stop event bubbling
    
    // Check if user is logged in before toggling wishlist
    if (!wishlistLoggedIn) {
      router.push('/login?redirect=/products')
      return
    }
    
    await toggleWishlist(product)
  }
   
  return (
    <div className="group cursor-pointer h-full">
      <Link href={`/products/${product.slug || product._id}`}>
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col border border-gray-100 group-hover:border-yellow-200">
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={product.images?.[0] || "/placeholder.svg?height=300&width=300&query=product"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {product.featured && (
              <div
                className="absolute top-2 left-2 px-1.5 py-0.5 text-xs font-semibold text-white rounded-full shadow-md"
                style={{ background: "linear-gradient(135deg, #8C6141 0%, #5A0117 100%)", fontFamily: "Montserrat, sans-serif" }}
              >
                Featured
              </div>
            )}
            
            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white hover:scale-105 transition-all duration-200 group/wishlist shadow-md z-10"
              title={!wishlistLoggedIn ? 'Click to login and add to wishlist' : isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist(product._id) ? (
                <svg
                  className="w-5 h-5 text-red-500 group-hover/wishlist:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-600 group-hover/wishlist:text-red-500 group-hover/wishlist:scale-110 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          </div>

          <div className="p-2 flex-1 flex flex-col">
            {/* Product Title */}
            <h3
              className="text-sm font-semibold mb-1 group-hover:text-yellow-600 transition-colors line-clamp-2 h-8 flex items-start leading-tight"
              style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}
            >
              {product.name}
            </h3>
            
            {/* Price */}
            <div className="mb-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                  ₹{product.price}
                </span>
                {((product.mrp && product.mrp > product.price) || (product.originalPrice && product.originalPrice > product.price)) && (
                  <span className="text-xs text-gray-500 line-through" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    ₹{product.mrp || product.originalPrice}
                  </span>
                )}
              </div>
            </div>
            
            {/* Stock Information with Cart Icon */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ 
                fontFamily: "Montserrat, sans-serif",
                backgroundColor: product.stock > 0 ? '#dcfce7' : '#fef2f2',
                color: product.stock > 0 ? '#166534' : '#dc2626'
              }}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
              
            {/* Cart Icon */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || isAdding}
                className={`p-1.5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  product.stock <= 0
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white hover:scale-105'
                }`}
                title={product.stock <= 0 ? 'Out of stock' : !isLoggedIn ? 'Click to login and add to cart' : 'Add to cart'}
              >
                {isAdding ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  // <svg
                  //   className="w-3 h-3"
                  //   fill="none"
                  //   stroke="currentColor"
                  //   viewBox="0 0 24 24"
                  // >
                  //   <path
                  //     strokeLinecap="round"
                  //     strokeLinejoin="round"
                  //     strokeWidth={2}
                  //     d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h8a2 2 0 002-2v-8"
                  //   />
                  // </svg>
                  <MdOutlineShoppingCart/>
                )}
              </button>
            </div>
            
            {/* Buy Now Button - Full Width */}
            <div className="mt-auto">
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className={`w-full py-1.5 px-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                  product.stock <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white hover:opacity-90'
                }`}
                style={{
                  background: product.stock <= 0 ? undefined : '#5A0117',
                  fontFamily: "Montserrat, sans-serif"
                }}
                title={product.stock <= 0 ? 'Out of stock' : !isLoggedIn ? 'Click to login and buy now' : 'Buy now'}
              >
                {product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
