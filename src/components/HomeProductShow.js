"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

export default function HomeProductShow() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // Fetch exactly 20 products, sorted by name for consistency
        const response = await fetch('/api/products?limit=20&sortBy=name&page=1', {
          headers: {
            'Cache-Control': 'max-age=300', // Cache for 5 minutes
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.products) {
          // Ensure we have exactly 20 products or less
          const limitedProducts = data.products.slice(0, 20)
          setProducts(limitedProducts)
          console.log(`🏠 Home: Loaded ${limitedProducts.length} products for homepage`)
        } else {
          console.error('Home products API error:', data.error)
          setError(data.error || 'Failed to load products')
        }
      } catch (error) {
        console.error('Error fetching home products:', error)
        setError('Unable to load products. Please try refreshing the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleBuyNow = (product, e) => {
    e.preventDefault() // Prevent link navigation
    e.stopPropagation()
    // Navigate to product detail page
    window.location.href = `/products/${product.slug || product._id}`
  }

  if (loading) {
    return (
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
            Our Products
          </h2>
          
          {/* Loading Skeleton */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 lg:grid-cols-10 gap-3 sm:gap-4">
            {/* Mobile: Show 10 skeleton items */}
            {[...Array(10)].map((_, index) => (
              <div key={`mobile-skeleton-${index}`} className="animate-pulse md:hidden">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
            
            {/* Desktop: Show 20 skeleton items */}
            {[...Array(20)].map((_, index) => (
              <div key={`desktop-skeleton-${index}`} className="animate-pulse hidden md:block">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
            Our Products
          </h2>
          <p className="text-lg" style={{ color: "#8C6141" }}>
            {error}
          </p>
        </div>
      </section>
    )
  }

  // Show fallback when no products
  if (!loading && products.length === 0 && !error) {
    return (
      <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
            Our Products
          </h2>
          <div className="py-16">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Products Coming Soon
            </h3>
            <p className="text-lg mb-8" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
              We're working hard to bring you amazing products. Check back soon!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border-2 rounded-full font-semibold transition-all hover:scale-105"
              style={{ borderColor: "#5A0117", color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
          Our Products
        </h2>
        
        {/* Products Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
          {/* Mobile: Show first 10 products (2 rows × 5) */}
          {products.slice(0, 8).map((product, index) => (
            <Link
              key={`mobile-${product._id}`}
              href={`/products/${product.slug || product._id}`}
              className="group   block md:hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 overflow-hidden border border-gray-100 h-32 flex flex-col"
            >
              {/* Product Image */}
              <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-50 flex-shrink-0">
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name || 'Product'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="20vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400 text-xs text-center">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="pb-8 flex flex-col h-full">
                <h3 
                  className="font-medium mb-0.5 truncate group-hover:text-opacity-80 leading-tight" 
                  style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif", fontSize: '8px', lineHeight: '10px' }}
                  title={product.name || 'Untitled Product'}
                >
                  {product.name || 'Untitled Product'}
                </h3>
                
                <div className="flex flex-col mb-1">
                  <span 
                    className="font-bold truncate" 
                    style={{ color: "#5A0117", fontSize: '8px' }}
                  >
                    ₹{(product.price || 0).toLocaleString()}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-gray-500 line-through truncate" style={{ fontSize: '7px' }}>
                      ₹{product.mrp.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Buy Now Button */}
                <button
                  onClick={(e) => handleBuyNow(product, e)}
                  className="w-full  py-0.5 px-1 font-medium text-white rounded transition-all hover:opacity-90 active:scale-95 mt-auto"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif", fontSize: '7px' }}
                >
                  Buy Now
                </button>
              </div>
            </Link>
          ))}
          
          {/* Desktop: Show all 20 products (2 rows × 10) */}
          {products.slice(0, 16).map((product, index) => (
            <Link
              key={`desktop-${product._id}`}
              href={`/products/${product.slug || product._id}`}
              className="group hidden md:block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 overflow-hidden border border-gray-100"
            >
              {/* Product Image */}
              <div className="w-full aspect-square relative overflow-hidden rounded-t-lg bg-gray-50">
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name || 'Product'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 20vw, (max-width: 768px) 10vw, 10vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400 text-xs text-center">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-2 h-24 flex flex-col justify-between">
                <div>
                  <h3 
                    className="text-xs font-medium mb-1 truncate group-hover:text-opacity-80 leading-tight" 
                    style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                    title={product.name || 'Untitled Product'}
                  >
                    {product.name || 'Untitled Product'}
                  </h3>
                  
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex flex-col">
                      <span 
                        className="text-xs font-bold" 
                        style={{ color: "#5A0117" }}
                      >
                        ₹{(product.price || 0).toLocaleString()}
                      </span>
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.mrp.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded text-center leading-none">
                        {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Buy Now Button */}
                <button
                  onClick={(e) => handleBuyNow(product, e)}
                  className="w-full py-1.5 px-2 text-xs font-semibold text-white rounded transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  Buy Now
                </button>
              </div>
            </Link>
          ))}
        </div>
        
        {/* View All Button - Styled like the image */}
        <div className="flex justify-center mt-12">
          <Link
            href="/products"
            className="group inline-flex items-center px-8 py-3 border-2 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-md"
            style={{ 
              borderColor: "#5A0117", 
              color: "#5A0117",
              backgroundColor: "rgba(219, 204, 183, 0.1)",
              fontFamily: "Sugar, serif"
            }}
          >
            <span className="mr-2">View All</span>
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
