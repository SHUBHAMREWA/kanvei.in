"use client"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "../../../../components/shared/Header"
import Footer from "../../../../components/shared/Footer"
import Image from "next/image"
import { useCart } from "../../../../contexts/CartContext"
import { useAuth } from "../../../../contexts/AuthContext"
import ReviewForm from "../../../../components/ReviewForm"
import ReviewsList from "../../../../components/ReviewsList"
import { AiOutlineEye, AiOutlineHeart, AiFillStar } from "react-icons/ai"
import { MdArrowBack, MdInfoOutline } from "react-icons/md"
import { FiZoomIn } from "react-icons/fi"

export default function ProductOptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [option, setOption] = useState(null)
  const [mainProduct, setMainProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef(null)
  const { addToCart, items } = useCart()
  const { user, isAuthenticated } = useAuth()

  // Fetch option and main product data
  useEffect(() => {
    const fetchOptionData = async () => {
      try {
        console.log('Fetching option data for ID:', params.id)
        
        // Fetch option details
        const optionRes = await fetch(`/api/products/option/${params.id}`)
        const optionData = await optionRes.json()
        
        console.log('Option API Response:', optionData)
        
        if (optionData.success && optionData.option) {
          setOption(optionData.option)
          console.log('Option set:', optionData.option)
          
          // Fetch main product details
          const productRes = await fetch(`/api/products/detail/${optionData.option.productId}`)
          const productData = await productRes.json()
          
          console.log('Product API Response:', productData)
          
          if (productData.success && productData.product) {
            setMainProduct(productData.product)
            console.log('Main product set:', productData.product)
            
            // Fetch reviews for main product
            const reviewsRes = await fetch(`/api/reviews/${optionData.option.productId}`)
            const reviewsData = await reviewsRes.json()
            
            if (reviewsData.success) {
              setReviews(reviewsData.reviews)
              setRating(reviewsData.rating)
            }
          } else {
            console.error('Failed to fetch main product:', productData.error)
          }
        } else {
          console.error('Failed to fetch option:', optionData.error)
        }
      } catch (error) {
        console.error("Error fetching option data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOptionData()
    }
  }, [params.id])

  // Check if option is already in cart
  const cartItem = items.find(item => item.productOption?._id === params.id)
  const cartQuantity = cartItem?.quantity || 0
  const isInCart = !!cartItem
  const availableStock = Math.max(0, (option?.stock || 0) - cartQuantity)
  const maxQuantityToAdd = Math.min(quantity, availableStock)

  const handleAddToCart = () => {
    if (option && mainProduct && maxQuantityToAdd > 0) {
      const selectedOption = {
        id: option._id,
        size: option.size,
        color: option.color,
        price: option.price,
        stock: option.stock,
        images: option.images || []
      }
      
      addToCart(mainProduct, maxQuantityToAdd, selectedOption)
      alert(`Added ${maxQuantityToAdd} ${mainProduct.name} (${option.size || ''} ${option.color || ''}) to cart`)
      setQuantity(1)
    }
  }

  const handleBackToMain = () => {
    if (mainProduct) {
      router.push(`/products/${mainProduct.slug || mainProduct._id}`)
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: "#5A0117" }}></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!option || !mainProduct) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Product Option not found
            </h1>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              The product option you are looking for does not exist.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="mt-4 px-6 py-2 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Browse Products
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const optionImages = option.images && option.images.length > 0 ? option.images : (mainProduct?.images || [])
  const displayName = `${mainProduct?.name || 'Product'}${option.size ? ` - ${option.size}` : ''}${option.color ? ` - ${option.color}` : ''}`

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBackToMain}
            className="flex items-center gap-2 mb-6 text-sm hover:opacity-80"
            style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
          >
            <MdArrowBack className="w-4 h-4" />
            Back to {mainProduct.name}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Side - Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative">
                {optionImages && optionImages.length > 0 ? (
                  <Image
                    src={optionImages[activeImageIndex] || "/placeholder.svg"}
                    alt={displayName}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl text-gray-400 mb-2">📷</div>
                      <p className="text-sm text-gray-500">No image available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {optionImages && optionImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {optionImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        index === activeImageIndex ? 'border-opacity-100 ring-2 ring-offset-1' : 'border-opacity-30 hover:border-opacity-60'
                      }`}
                      style={{ borderColor: "#5A0117", ringColor: index === activeImageIndex ? "#5A0117" : "transparent" }}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${displayName} ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Product Information */}
            <div className="space-y-6">
              {/* Product Title */}
              <div>
                {mainProduct.brand && (
                  <p className="text-sm font-medium mb-2" style={{ color: "#8C6141" }}>
                    {mainProduct.brand}
                  </p>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  {displayName}
                </h1>
                
                {/* Option Details Badge */}
                <div className="mt-3 flex gap-2">
                  {option.size && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Size: {option.size}
                    </span>
                  )}
                  {option.color && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Color: {option.color}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-3xl font-bold" style={{ color: "#5A0117" }}>
                    ₹{(option.price || mainProduct.price).toLocaleString()}
                  </span>
                  {option.mrp && option.mrp > (option.price || mainProduct.price) && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{option.mrp.toLocaleString()}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        {Math.round(((option.mrp - (option.price || mainProduct.price)) / option.mrp) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium" style={{ color: "#8C6141" }}>Stock:</span>
                  <span className={option.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                    {option.stock > 0 ? `${option.stock} available` : 'Out of stock'}
                  </span>
                </div>
                {isInCart && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <div className="text-sm font-medium text-green-700" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      ✓ {cartQuantity} item(s) already in cart
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {mainProduct.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                    Description
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      {mainProduct.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="space-y-4">
                {option.stock > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#5A0117" }}>
                      Quantity:
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
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
                        className="w-10 h-10 border-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
                        style={{ borderColor: "#5A0117", color: "#5A0117" }}
                      >
                        +
                      </button>
                      
                      {/* Stock messages */}
                      <div className="ml-3 text-sm">
                        {quantity >= availableStock && availableStock > 0 && (
                          <span className="text-orange-600">Max available</span>
                        )}
                        {availableStock === 0 && (
                          <span className="text-red-600">No more available</span>
                        )}
                        {availableStock > 0 && quantity < availableStock && (
                          <span className="text-gray-500">{availableStock} available</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={option.stock === 0 || availableStock === 0}
                    className="flex-1 py-3 px-6 text-white font-semibold rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#5A0117" }}
                  >
                    {option.stock === 0 
                      ? 'Out of Stock' 
                      : availableStock === 0 
                      ? 'No More Available'
                      : isInCart 
                      ? `Add ${maxQuantityToAdd} More`
                      : `Add ${maxQuantityToAdd} to Cart`
                    }
                  </button>
                  <button
                    onClick={handleBackToMain}
                    className="px-6 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#8C6141", color: "#8C6141" }}
                  >
                    View All Options
                  </button>
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
