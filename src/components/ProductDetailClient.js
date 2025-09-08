"use client"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Header from "./shared/Header"
import Footer from "./shared/Footer"
import Image from "next/image"
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Swiper, SwiperSlide } from 'swiper/modules'
import { Navigation, Pagination } from 'swiper/modules'
import { useRouter } from 'next/navigation'
import { AiOutlineEye, AiOutlineHeart, AiFillStar } from "react-icons/ai"
import { MdClear, MdInfoOutline } from "react-icons/md"
import { FiZoomIn } from "react-icons/fi"
import { BsLightning } from "react-icons/bs"
import { IoMdShareAlt } from "react-icons/io"
import ReviewsList from "./ReviewsList"
import ReviewForm from "./ReviewForm"

export default function ProductDetailClient({ product: initialProduct }) {
  const router = useRouter()
  const params = useParams()
  const [product, setProduct] = useState(initialProduct)
  const [loading, setLoading] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const imageContainerRef = useRef(null)
  const { addToCart, items } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()

  // Increment product views on mount (works for both slug or ObjectId)
  useEffect(() => {
    const incrementViews = async () => {
      try {
        if (!params.id) return
        const res = await fetch(`/api/products/${params.id}/views`, { method: 'POST' })
        const data = await res.json()
        if (data?.success) {
          setProduct((prev) => prev ? { ...prev, views: data.views } : prev)
        }
      } catch (err) {
        console.error('Error incrementing product views:', err)
      }
    }
    incrementViews()
  }, [params.id])

  // Fetch reviews on component mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // API now supports both slug and ID
        const res = await fetch(`/api/reviews/${params.id}`)
        const data = await res.json()
        if (data.success) {
          setReviews(data.reviews)
          setRating(data.rating)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      }
    }

    if (params.id) {
      fetchReviews()
    }
  }, [params.id])

  // Reset active image index when options change
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedOptions]);

  const handleOptionSelect = (optionType, option) => {
    console.log('Option selected:', { optionType, option })
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: prev[optionType]?.id === option.id ? null : option
    }))
    setQuantity(1)
  }

  const handleAddToCart = async () => {
    // Check if user is authenticated first
    if (!isAuthenticated || !user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      router.push(redirectUrl)
      return
    }
    
    const availableStock = getAvailableStock()
    const maxQuantityToAdd = Math.min(quantity, availableStock)
    
    if (product && maxQuantityToAdd > 0) {
      const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
      
      // Check if any option is selected
      let selectedOption = null
      if (selectedOptionValues.length > 0) {
        // Combine all selected options into one object
        const combinedOption = selectedOptionValues.reduce((acc, opt) => ({
          ...acc,
          ...opt
        }), {})
        
        selectedOption = {
          id: combinedOption.id,
          size: combinedOption.size,
          color: combinedOption.color,
          price: combinedOption.price || getCurrentPrice(),
          stock: combinedOption.stock || getCurrentStock(),
          images: combinedOption.images || getCurrentImages()
        }
      }
      
      // Add to cart with option if selected
      const success = await addToCart(product, maxQuantityToAdd, selectedOption);
      
      // Only show success message and reset quantity if actually added to cart
      if (success) {
        const optionText = selectedOptionValues.length > 0 
          ? ` (${selectedOptionValues.map(opt => `${opt.size || opt.color || opt.name}`).join(', ')})` 
          : ''
        showSuccess(`Added ${maxQuantityToAdd} ${product.name}${optionText} to cart`, 4000);
        
        // Reset quantity after successful add
        setQuantity(1)
        
        // Redirect to checkout page after successful add to cart
        setTimeout(() => {
          router.push('/checkout')
        }, 1500)
      }
    }
  }

  // Get current images based on selected options (limited to 5 images max) 
  const getCurrentImages = () => {
    const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
    
    let images = []
    
    // If any option is selected and has images, use those
    for (let option of selectedOptionValues) {
      if (option.images && option.images.length > 0) {
        images = option.images
        break
      }
    }
    
    // Otherwise use product images
    if (images.length === 0) {
      images = product?.images || []
    }
    
    // Limit to maximum 5 images
    return images.slice(0, 5)
  }

  // Get current price based on selected options
  const getCurrentPrice = () => {
    const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
    let price = product?.price || 0
    
    // Add option price differences
    selectedOptionValues.forEach(option => {
      if (option.priceModifier) {
        price += option.priceModifier
      } else if (option.price) {
        price = option.price
      }
    })
    
    return price
  }

  // Get current MRP
  const getCurrentMRP = () => {
    const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
    let mrp = product?.mrp || 0
    
    selectedOptionValues.forEach(option => {
      if (option.mrp) {
        mrp = option.mrp
      }
    })
    
    return mrp
  }

  // Get current stock
  const getCurrentStock = () => {
    const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
    
    if (selectedOptionValues.length > 0) {
      // Return the minimum stock among selected options
      return Math.min(...selectedOptionValues.map(opt => opt.stock || 0))
    }
    
    return product?.stock || 0
  }
  
  // Get available stock (considering items already in cart)
  const getAvailableStock = () => {
    const currentStock = getCurrentStock()
    
    // Check for specific option in cart or main product
    let cartQuantity = 0
    const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
    
    if (selectedOptionValues.length > 0) {
      // Check if this specific option combination is in cart
      const combinedOption = selectedOptionValues.reduce((acc, opt) => ({ ...acc, ...opt }), {})
      const optionCartItem = items.find(item => {
        // For product options, compare with productOption ID
        return item.productOption?._id === combinedOption.id || item.productOption?._id === combinedOption._id
      })
      cartQuantity = optionCartItem?.quantity || 0
    } else {
      // Check main product in cart
      const mainCartItem = items.find(item => {
        // For main products, compare product ID and ensure no productOption is set
        return item.product?._id === product?._id && !item.productOption
      })
      cartQuantity = mainCartItem?.quantity || 0
    }
    
    return Math.max(0, currentStock - cartQuantity)
  }

  // Get key highlights from attributes
  const getKeyHighlights = () => {
    const highlightAttributes = ['RAM', 'Storage', 'Processor', 'Display', 'Camera', 'Battery', 'Warranty']
    return product?.attributes?.filter(attr => 
      highlightAttributes.some(highlight => 
        attr.name?.toLowerCase().includes(highlight.toLowerCase())
      )
    ) || []
  }

  // Group attributes by type/category
  const getGroupedAttributes = () => {
    const groups = {}
    product?.attributes?.forEach(attr => {
      const groupName = attr.group || 'General'
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(attr)
    })
    return groups
  }

  // Check if product should have options - show if options exist
  const shouldShowOptions = () => {
    // Always show options if they exist in the product
    if (product?.options && product.options.length > 0) {
      return true
    }
    
    // Fallback: check category for specific types
    if (!product?.category) return false
    const category = product.category.toLowerCase()
    return category.includes('shoe') || category.includes('cloth') || category.includes('apparel') || category.includes('garment') || category.includes('dress') || category.includes('shirt') || category.includes('pant') || category.includes('jean') || category.includes('footwear')
  }

  // Group options by type
  const getGroupedOptions = () => {
    if (!shouldShowOptions()) return {}
    
    const groups = {}
    product?.options?.forEach(option => {
      const groupName = option.size ? 'Size' : option.color ? 'Color' : 'Options'
      if (!groups[groupName]) groups[groupName] = []
      groups[groupName].push(option)
    })
    return groups
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      router.push(redirectUrl)
      return
    }

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, productId: product._id }),
      })

      const data = await res.json()
      if (data.success) {
        setIsInWishlist(data.action === "added")
        if (data.action === "added") {
          showSuccess("Added to wishlist ❤️", 3000)
        } else {
          showInfo("Removed from wishlist", 3000)
        }
      } else {
        showError(data.error || "Failed to update wishlist", 4000)
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      showError("Failed to update wishlist. Please try again.", 4000)
    }
  }

  const handleReviewAdded = () => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews/${params.id}`)
        const data = await res.json()
        if (data.success) {
          setReviews(data.reviews)
          setRating(data.rating)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      }
    }
    fetchReviews()
  }

  // Handle Buy Now functionality
  const handleBuyNow = async () => {
    // Check if user is authenticated first
    if (!isAuthenticated || !user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      router.push(redirectUrl)
      return
    }
    
    if (currentStock === 0 || availableStock === 0) {
      showError("Product is out of stock", 3000)
      return
    }

    // First add to cart, then redirect to checkout
    const success = await handleAddToCart()
    
    // Only redirect if successfully added to cart
    if (success) {
      setTimeout(() => {
        window.location.href = '/checkout'
      }, 1000)
    }
  }

  // Handle Share functionality
  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this amazing ${product.name} - ₹${currentPrice.toLocaleString()}`,
      url: window.location.href
    }

    try {
      // Try using Web Share API first (mobile devices)
      if (navigator.share) {
        await navigator.share(shareData)
        showSuccess("Product shared successfully! 📤", 3000)
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href)
        showSuccess("Product link copied to clipboard! 📋", 3000)
      }
    } catch (error) {
      // Fallback if both methods fail
      try {
        await navigator.clipboard.writeText(window.location.href)
        showSuccess("Product link copied to clipboard! 📋", 3000)
      } catch (clipboardError) {
        showError("Unable to share or copy link", 3000)
      }
    }
  }

  // Calculate current data using helper functions
  const currentImages = getCurrentImages()
  const currentPrice = getCurrentPrice()
  const currentMRP = getCurrentMRP()
  const currentStock = getCurrentStock()
  const availableStock = getAvailableStock()
  const keyHighlights = getKeyHighlights()
  const groupedAttributes = getGroupedAttributes()
  const groupedOptions = getGroupedOptions()
  const swiperKey = JSON.stringify(selectedOptions) + product?._id;
  
  // Check if current selection (main product or specific option) is in cart
  const getCartInfo = () => {
    const selectedOptionValues = Object.values(selectedOptions).filter(Boolean)
    
    if (selectedOptionValues.length > 0) {
      // Check for specific option in cart
      const combinedOption = selectedOptionValues.reduce((acc, opt) => ({ ...acc, ...opt }), {})
      const optionCartItem = items.find(item => {
        // For product options, compare with productOption ID
        return item.productOption?._id === combinedOption.id || item.productOption?._id === combinedOption._id
      })
      return {
        cartItem: optionCartItem,
        cartQuantity: optionCartItem?.quantity || 0,
        isInCart: !!optionCartItem
      }
    } else {
      // Check main product in cart (excluding options)
      const mainCartItem = items.find(item => {
        // For main products, compare product ID and ensure no productOption is set
        return item.product?._id === product?._id && !item.productOption
      })
      return {
        cartItem: mainCartItem,
        cartQuantity: mainCartItem?.quantity || 0,
        isInCart: !!mainCartItem
      }
    }
  }
  
  const cartInfo = getCartInfo()
  const { cartItem, cartQuantity, isInCart } = cartInfo
  const maxQuantityToAdd = Math.min(quantity, availableStock)
  
  // Debug logging
  console.log('Current display data:', {
    selectedOptions,
    currentImages: currentImages?.length || 0,
    currentPrice,
    currentMRP,
    currentStock,
    productImages: product?.images?.length || 0
  })

  // Debug options data
  console.log('Options Debug:', {
    productOptions: product?.options,
    productOptionsLength: product?.options?.length || 0,
    productCategory: product?.category,
    shouldShowOptions: shouldShowOptions(),
    groupedOptions,
    groupedOptionsKeys: Object.keys(groupedOptions)
  })

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Product not found
            </h1>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              The product you are looking for does not exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Handle mouse events for zoom effect (desktop only)
  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) { // Only on desktop
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleMouseMove = (e) => {
    if (!isHovered || window.innerWidth < 768) return
    
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePosition({ x, y })
    }
  }

  // Touch swipe handlers for mobile image navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null) // Reset touch end
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwipeInProgress(false)
    setSwipeOffset(0)
  }

  const handleTouchMove = (e) => {
    if (!touchStart) return
    
    const currentTouch = e.targetTouches[0].clientX
    setTouchEnd(currentTouch)
    
    // Calculate offset for visual feedback
    const offset = currentTouch - touchStart
    setSwipeOffset(offset)
    setIsSwipeInProgress(true)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwipeInProgress(false)
      setSwipeOffset(0)
      return
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 75 // Increased threshold for better UX
    const isRightSwipe = distance < -75
    
    // Only handle swipes if there are multiple images
    if (currentImages && currentImages.length > 1) {
      if (isLeftSwipe) {
        // Swipe left - next image
        setActiveImageIndex((prev) => 
          prev === currentImages.length - 1 ? 0 : prev + 1
        )
      } else if (isRightSwipe) {
        // Swipe right - previous image
        setActiveImageIndex((prev) => 
          prev === 0 ? currentImages.length - 1 : prev - 1
        )
      }
    }
    
    // Reset swipe states with animation
    setIsSwipeInProgress(false)
    setSwipeOffset(0)
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Clear selected options with animation
  const clearOptions = () => {
    // Add a small animation/fade effect
    const optionButtons = document.querySelectorAll('[data-option-button]')
    optionButtons.forEach(button => {
      button.style.transform = 'scale(0.95)'
      setTimeout(() => {
        button.style.transform = 'scale(1)'
      }, 150)
    })
    
    setSelectedOptions({})
    setActiveImageIndex(0)
    setQuantity(1) // Reset quantity as well
    
    // Show confirmation feedback
    const confirmationMessage = "Selection cleared - showing original product"
    console.log(confirmationMessage)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            
            {/* Left Side - Image Gallery */}
            <div className="space-y-4">
              {/* Main Image with Zoom Effect and Wishlist */}
              <div className="relative">
                <div 
                  ref={imageContainerRef}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative cursor-zoom-in max-w-sm mx-auto lg:max-w-md xl:max-w-lg"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {currentImages && currentImages.length > 0 ? (
                    <Image
                      key={`main-${activeImageIndex}-${JSON.stringify(selectedOptions)}`}
                      src={currentImages[activeImageIndex] || "/placeholder.svg"}
                      alt={`${product.name} ${activeImageIndex + 1}`}
                      fill
                      className={`object-cover transition-transform duration-300 ${
                        isHovered ? 'scale-150' : 'scale-100'
                      }`}
                      style={{
                        transformOrigin: isHovered ? `${mousePosition.x}% ${mousePosition.y}%` : 'center',
                        transform: `${isHovered ? `scale(1.5)` : 'scale(1)'} ${isSwipeInProgress ? `translateX(${Math.min(Math.max(swipeOffset, -100), 100)}px)` : 'translateX(0px)'}`,
                        transition: isSwipeInProgress ? 'none' : 'transform 0.3s ease-out'
                      }}
                      priority={activeImageIndex === 0}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl text-gray-400 mb-2">📷</div>
                        <p className="text-sm text-gray-500">No image available</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Wishlist and Share Buttons - Top Right */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                      onClick={handleWishlistToggle}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isInWishlist 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <AiOutlineHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg bg-white hover:bg-gray-50"
                      style={{ color: "#8C6141" }}
                      title="Share Product"
                    >
                      <IoMdShareAlt className="w-5 h-5" />
                    </button>
                    
                    {/* Add to Cart Button - Mobile Only */}
                    <button
                      onClick={handleAddToCart}
                      disabled={currentStock === 0 || availableStock === 0}
                      className="sm:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      style={{ backgroundColor: "#5A0117" }}
                      title="Add to Cart"
                    >
                      <span className="text-lg font-bold">+</span>
                    </button>
                  </div>
                  
                  {/* Zoom Icon - Top Left (Desktop Only) */}
                  <div className="hidden md:block absolute top-3 left-3 bg-white bg-opacity-80 p-2 rounded-full">
                    <FiZoomIn className="w-4 h-4 text-gray-600" />
                  </div>
                  
                  {/* Navigation Arrows */}
                  {currentImages && currentImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex((prev) => 
                          prev === 0 ? currentImages.length - 1 : prev - 1
                        )}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                        style={{ color: "#5A0117" }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setActiveImageIndex((prev) => 
                          prev === currentImages.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                        style={{ color: "#5A0117" }}
                      >
                        ›
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {currentImages && currentImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full">
                      {activeImageIndex + 1} / {currentImages.length}
                    </div>
                  )}
                  
                  {/* Views Counter */}
                  <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 px-3 py-2 rounded-full flex items-center gap-2 shadow-md">
                    <AiOutlineEye className="w-4 h-4" style={{ color: "#8C6141" }} />
                    <span className="text-sm font-medium" style={{ color: "#5A0117" }}>
                      {product.views ? product.views.toLocaleString() : 0} views
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Thumbnail Images */}
              {currentImages && currentImages.length > 1 && (
                <div className="flex justify-center">
                  <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-6 gap-2 max-w-sm mx-auto lg:max-w-md xl:max-w-lg">
                    {currentImages.map((image, index) => (
                      <button
                        key={`thumb-${index}-${JSON.stringify(selectedOptions)}`}
                        onClick={() => setActiveImageIndex(index)}
                        className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          index === activeImageIndex 
                            ? 'border-opacity-100 ring-2 ring-offset-1' 
                            : 'border-opacity-30 hover:border-opacity-60'
                        }`}
                        style={{ 
                          borderColor: "#5A0117",
                          ringColor: index === activeImageIndex ? "#5A0117" : "transparent"
                        }}
                      >
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Product Information */}
            <div className="space-y-6">
              {/* Product Title and Brand */}
              <div>
                {product.brand && (
                  <p className="text-sm font-medium mb-2" style={{ color: "#8C6141" }}>
                    {product.brand}
                  </p>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      {product.name}
                    </h1>
                    {product.title && product.title !== product.name && (
                      <p className="text-lg text-gray-600 mt-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                        {product.title}
                      </p>
                    )}
                  </div>
                  
                  {/* Buy Now Button - Mobile Only, Share Button - Desktop Only */}
                  <button
                    onClick={handleBuyNow}
                    disabled={currentStock === 0 || availableStock === 0}
                    className="sm:hidden flex items-center justify-center gap-2 py-2 px-4 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#5A0117" }}
                    title="Buy Now"
                  >
                    <BsLightning className="w-4 h-4" />
                    {currentStock === 0 
                      ? 'Out of Stock' 
                      : availableStock === 0 
                      ? 'No More Available'
                      : 'Buy Now'
                    }
                  </button>
                  
                  {/* Share Button - Desktop Only */}
                  <button
                    onClick={handleShare}
                    className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                    style={{ borderColor: "#8C6141", color: "#8C6141" }}
                    title="Share Product"
                  >
                    <IoMdShareAlt className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <AiFillStar
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(rating.average) ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium" style={{ color: "#8C6141" }}>
                  {rating.average > 0 ? rating.average.toFixed(1) : '0.0'} ({rating.count} reviews)
                </span>
              </div>


              {/* Price Section */}
              <div className="flex flex-wrap items-center justify-between mb-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-bold" style={{ color: "#5A0117" }}>
                    ₹{currentPrice.toLocaleString()}
                  </span>
                  {currentMRP && currentMRP > currentPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{currentMRP.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        {Math.round(((currentMRP - currentPrice) / currentMRP) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                
                {/* Buy Now Button - Desktop Only */}
                <button
                  onClick={handleBuyNow}
                  disabled={currentStock === 0 || availableStock === 0}
                  className="hidden sm:flex items-center justify-center gap-2 py-3 px-6 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 mt-2 sm:mt-0"
                  style={{ backgroundColor: "#5A0117" }}
                >
                  <BsLightning className="w-4 h-4" />
                  {currentStock === 0 
                    ? 'Out of Stock' 
                    : availableStock === 0 
                    ? 'No More Available'
                    : 'Buy Now'
                  }
                </button>
              </div>

              {/* Available Options - Now placed directly below price */}
              {Object.keys(groupedOptions).length > 0 && (
                <div className="border rounded-lg p-4" style={{ backgroundColor: "#FAFAFA" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: "#5A0117" }}>
                      Available Options
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Original Product Option - Always First */}
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:flex lg:flex-wrap gap-2">
                      <button
                        onClick={clearOptions}
                        className={`p-2 sm:px-3 sm:py-2 border-2 rounded-lg text-xs transition-all transform hover:scale-105 ${
                          Object.keys(selectedOptions).length === 0 
                            ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-600 shadow-lg ring-2 ring-red-200 ring-opacity-50' 
                            : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50 hover:shadow-md'
                        }`}
                        style={{
                          borderColor: Object.keys(selectedOptions).length === 0 ? "#dc2626" : "#5A0117",
                          boxShadow: Object.keys(selectedOptions).length === 0 ? '0 4px 12px rgba(220, 38, 38, 0.15)' : 'none'
                        }}
                      >
                        <div className="flex flex-col items-center gap-1 sm:gap-2 sm:flex-row">
                          {product.images && product.images[0] && (
                            <div className="relative">
                              <Image 
                                src={product.images[0]}
                                alt={`${product.name} original`}
                                width={50}
                                height={50}
                                className="rounded w-10 h-10 sm:w-12 sm:h-12 object-cover flex-shrink-0"
                              />
                            </div>
                          )}
                          <div className="text-center sm:text-left min-w-0 flex-1">
                            <div className="font-semibold text-xs leading-tight" style={{ color: "#5A0117" }}>
                              {/* Show original product size first, then color as fallback */}
                              {product.attributes && product.attributes.find(attr => 
                                attr.name.toLowerCase().includes('size')
                              ) ? 
                                product.attributes.find(attr => attr.name.toLowerCase().includes('size')).type :
                                (product.attributes && product.attributes.find(attr => 
                                  attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour')
                                ) ? 
                                  product.attributes.find(attr => 
                                    attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour')
                                  ).type : 'Standard'
                                )
                              }
                            </div>
                            
                            {/* Show original product color in separate div for mobile */}
                            {product.attributes && product.attributes.find(attr => 
                              attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour')
                            ) && (
                              <div className="text-xs text-ellipsis overflow-hidden whitespace-nowrap max-w-full" style={{ color: "#8C6141" }}>
                                {product.attributes.find(attr => 
                                  attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour')
                                ).type}
                              </div>
                            )}
                            
                            {product.price && (
                              <div className="text-xs font-medium" style={{ color: "#8C6141" }}>
                                ₹{product.price.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {/* Other Options */}
                      {Object.entries(groupedOptions).map(([groupName, options]) => 
                        options.map((option, index) => {
                          const isSelected = selectedOptions[groupName]?.id === option._id
                          return (
                            <button
                              key={`${groupName}-${index}`}
                              onClick={() => handleOptionSelect(groupName, { 
                                id: option._id, 
                                name: option.size || option.color || 'Option',
                                size: option.size,
                                color: option.color,
                                price: option.price,
                                mrp: option.mrp,
                                stock: option.stock,
                                images: option.images
                              })}
                              className={`p-2 sm:px-3 sm:py-2 border-2 rounded-lg text-xs transition-all transform hover:scale-105 ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-600 shadow-lg ring-2 ring-red-200 ring-opacity-50' 
                                  : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50 hover:shadow-md'
                              }`}
                              style={{
                                borderColor: isSelected ? "#dc2626" : "#5A0117",
                                boxShadow: isSelected ? '0 4px 12px rgba(220, 38, 38, 0.15)' : 'none'
                              }}
                            >
                              <div className="flex flex-col items-center gap-1 sm:gap-2 sm:flex-row">
                                {option.images && option.images[0] && (
                                  <div className="relative">
                                    <Image 
                                      src={option.images[0]}
                                      alt={option.size || option.color || 'Option'}
                                      width={50}
                                      height={50}
                                      className="rounded w-10 h-10 sm:w-12 sm:h-12 object-cover flex-shrink-0"
                                    />
                                  </div>
                                )}
                                <div className="text-center sm:text-left min-w-0 flex-1">
                                  <div className="font-semibold text-xs leading-tight" style={{ color: "#5A0117" }}>
                                    {option.size || option.color}
                                  </div>
                                  
                                  {/* Show color in separate div for all screen sizes */}
                                  {option.color && option.size && (
                                    <div className="text-xs text-ellipsis overflow-hidden whitespace-nowrap max-w-full" style={{ color: "#8C6141" }}>
                                      {option.color}
                                    </div>
                                  )}
                                  
                                  {option.price && (
                                    <div className="text-xs font-medium" style={{ color: "#8C6141" }}>
                                      ₹{option.price.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* More Info Section */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  className="w-full px-4 py-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium flex items-center gap-2" style={{ color: "#5A0117" }}>
                    <MdInfoOutline className="w-5 h-5" />
                    More Information
                  </span>
                  <span className="text-xl" style={{ color: "#5A0117" }}>
                    {showMoreInfo ? '−' : '+'}
                  </span>
                </button>
                
                {showMoreInfo && (
                  <div className="p-4 bg-white border-t">
                    {/* Product Attributes */}
                    {product.attributes && product.attributes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-3" style={{ color: "#5A0117" }}>
                          Specifications
                        </h4>
                        <div className="space-y-2">
                          {product.attributes.map((attr, index) => {
                            // Check if this attribute is size or color and update accordingly
                            let displayValue = attr.type
                            const attrName = attr.name.toLowerCase()
                            
                            // Check for size attribute
                            if (attrName === 'size') {
                              // First check Size group options
                              if (selectedOptions['Size'] && selectedOptions['Size'].size) {
                                displayValue = selectedOptions['Size'].size
                              }
                              // Then check Color group options if they have size
                              else if (selectedOptions['Color'] && selectedOptions['Color'].size) {
                                displayValue = selectedOptions['Color'].size
                              }
                              // Fallback to name if size field doesn't exist
                              else if (selectedOptions['Size'] && selectedOptions['Size'].name) {
                                displayValue = selectedOptions['Size'].name
                              }
                            } 
                            // Check for color attribute
                            else if (attrName === 'color' || attrName === 'colour') {
                              // First check Color group options
                              if (selectedOptions['Color'] && selectedOptions['Color'].color) {
                                displayValue = selectedOptions['Color'].color
                              }
                              // Then check Size group options if they have color
                              else if (selectedOptions['Size'] && selectedOptions['Size'].color) {
                                displayValue = selectedOptions['Size'].color
                              }
                              // Fallback to name if color field doesn't exist but it's a color group
                              else if (selectedOptions['Color'] && selectedOptions['Color'].name) {
                                displayValue = selectedOptions['Color'].name
                              }
                            }
                            
                            // Debug logging for troubleshooting
                            if (attrName === 'color' || attrName === 'size') {
                              console.log(`Attribute: ${attr.name}`, {
                                originalValue: attr.type,
                                selectedOptions: selectedOptions,
                                sizeOption: selectedOptions['Size'],
                                colorOption: selectedOptions['Color'],
                                finalDisplayValue: displayValue
                              })
                            }
                            
                            return (
                              <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                                <span className="text-sm font-medium" style={{ color: "#8C6141" }}>
                                  {attr.name}
                                </span>
                                <span className="text-sm" style={{ color: "#5A0117" }}>
                                  {displayValue}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Stock and Category Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium" style={{ color: "#8C6141" }}>Stock:</span>
                        <p className={`${currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currentStock > 0 ? `${currentStock} available` : 'Out of stock'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium" style={{ color: "#8C6141" }}>Category:</span>
                        <p style={{ color: "#5A0117" }}>{product.category}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                    Description
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      {showFullDescription || product.description.length <= 200
                        ? product.description
                        : `${product.description.substring(0, 200)}...`
                      }
                    </p>
                    {product.description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-3 text-sm font-medium hover:underline"
                        style={{ color: "#5A0117" }}
                      >
                        {showFullDescription ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Action Buttons - Below Description */}
              <div className="sm:hidden space-y-4">
                {/* Quantity Selector for Mobile */}
                {currentStock > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Quantity:
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ borderColor: "#5A0117", color: "#5A0117" }}
                      >
                        −
                      </button>
                      <span className="text-lg font-semibold px-4" style={{ color: "#5A0117" }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={quantity >= availableStock}
                        className="w-10 h-10 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ borderColor: "#5A0117", color: "#5A0117" }}
                      >
                        +
                      </button>
                      
                      {/* Stock info for mobile */}
                      <div className="ml-3 text-sm">
                        {quantity >= availableStock && availableStock > 0 && (
                          <span className="text-orange-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Max available
                          </span>
                        )}
                        
                        {availableStock === 0 && (
                          <span className="text-red-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            No more available
                          </span>
                        )}
                        
                        {availableStock > 0 && quantity < availableStock && (
                          <span className="text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            {availableStock} available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Primary Action Button - Buy Now (Mobile First) */}
                <button
                  onClick={handleBuyNow}
                  disabled={currentStock === 0 || availableStock === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: "#5A0117" }}
                >
                  <BsLightning className="w-5 h-5" />
                  {currentStock === 0 
                    ? 'Out of Stock' 
                    : availableStock === 0 
                    ? 'No More Available'
                    : 'Buy Now'
                  }
                </button>
                
                {/* Secondary Actions - Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock === 0 || availableStock === 0}
                  className="w-full py-4 px-8 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: "#5A0117" }}
                >
                  {currentStock === 0 
                    ? 'Out of Stock' 
                    : availableStock === 0 
                    ? 'No More Available'
                    : isInCart 
                    ? `Add ${maxQuantityToAdd} More to Cart`
                    : `Add ${maxQuantityToAdd} to Cart`
                  }
                </button>
                
                {/* Wishlist and Share - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleWishlistToggle}
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all font-semibold ${
                      isInWishlist ? 'text-red-500 border-red-500 bg-red-50' : 'hover:bg-gray-50'
                    }`}
                    style={{
                      borderColor: isInWishlist ? '#ef4444' : '#8C6141',
                      color: isInWishlist ? '#ef4444' : '#8C6141'
                    }}
                  >
                    <AiOutlineHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                    <span className="text-sm">
                      {isInWishlist ? 'Remove' : 'Wishlist'}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all hover:bg-gray-50 font-semibold"
                    style={{
                      borderColor: '#8C6141',
                      color: '#8C6141'
                    }}
                  >
                    <IoMdShareAlt className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
                
                {/* Mobile Cart Info */}
                {isInCart && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      ✓ {cartQuantity} item(s) already in cart
                      {Object.values(selectedOptions).filter(Boolean).length > 0 && (
                        <span className="ml-2 text-xs">
                          ({Object.values(selectedOptions).filter(Boolean).map(opt => opt.size || opt.color || opt.name).join(', ')})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Show current cart info if item is in cart */}
              {isInCart && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    ✓ {cartQuantity} item(s) already in cart
                    {Object.values(selectedOptions).filter(Boolean).length > 0 && (
                      <span className="ml-2 text-xs">
                        ({Object.values(selectedOptions).filter(Boolean).map(opt => opt.size || opt.color || opt.name).join(', ')})
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              {/* Quantity and Actions */}
              <div className="space-y-4">
                {currentStock > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Quantity:
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ borderColor: "#5A0117", color: "#5A0117" }}
                      >
                        −
                      </button>
                      <span className="text-lg font-semibold px-4" style={{ color: "#5A0117" }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        disabled={quantity >= availableStock}
                        className="w-10 h-10 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ borderColor: "#5A0117", color: "#5A0117" }}
                      >
                        +
                      </button>
                      
                      {/* Stock limit messages */}
                      <div className="ml-3 text-sm">
                        {quantity >= availableStock && availableStock > 0 && (
                          <span className="text-orange-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Max available
                          </span>
                        )}
                        
                        {availableStock === 0 && (
                          <span className="text-red-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            No more available
                          </span>
                        )}
                        
                        {availableStock > 0 && quantity < availableStock && (
                          <span className="text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
                            {availableStock} available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons - Desktop Only */}
                <div className="hidden sm:block space-y-4">
          
                  
                  {/* Buy Now Button - Desktop (Full Width) */}
                  <button
                    onClick={handleBuyNow}
                    disabled={currentStock === 0 || availableStock === 0}
                    className="w-full flex items-center justify-center gap-2 py-4 px-8 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: "#5A0117" }}
                  >
                    <BsLightning className="w-5 h-5" />
                    {currentStock === 0 
                      ? 'Out of Stock' 
                      : availableStock === 0 
                      ? 'No More Available'
                      : 'Buy Now'
                    }
                  </button>  

                          {/* Primary Action - Add to Cart - Wider */}
                  <button
                    onClick={handleAddToCart}
                    disabled={currentStock === 0 || availableStock === 0}
                    className="w-full py-4 px-8 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: "#5A0117" }}
                  >
                    {currentStock === 0 
                      ? 'Out of Stock' 
                      : availableStock === 0 
                      ? 'No More Available'
                      : isInCart 
                      ? `Add ${maxQuantityToAdd} More to Cart`
                      : `Add ${maxQuantityToAdd} to Cart`
                    }
                  </button>
                  
                  {/* Secondary Actions - Wishlist and Share */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleWishlistToggle}
                      className={`px-6 py-3 border-2 rounded-lg transition-all font-semibold ${
                        isInWishlist ? 'text-red-500 border-red-500 bg-red-50' : 'hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor: isInWishlist ? '#ef4444' : '#8C6141',
                        color: isInWishlist ? '#ef4444' : '#8C6141'
                      }}
                    >
                      {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="px-6 py-3 border-2 rounded-lg transition-all hover:bg-gray-50 font-semibold"
                      style={{
                        borderColor: '#8C6141',
                        color: '#8C6141'
                      }}
                    >
                      Share Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Product Reviews
              </h2>
              {reviews && reviews.length > 0 ? (
                <ReviewsList reviews={reviews} rating={rating} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Write a Review
              </h2>
              {/* ReviewForm now handles all authentication and purchase eligibility checks */}
              <ReviewForm productId={product._id} onReviewAdded={handleReviewAdded} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
