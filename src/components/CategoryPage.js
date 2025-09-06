"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Header from "./shared/Header"
import Footer from "./shared/Footer"
import ProductCard from "./ProductCard"
import { ProductGridSkeleton } from "./ProductSkeleton"
import ProductSkeleton from "./ProductSkeleton"

// Custom styles for dual range slider and mobile filter button
const sliderStyles = `
  /* Mobile Filter Button Positioning */
  .mobile-filter-btn {
    position: fixed;
    bottom: 80px;
    right: 16px;
    z-index: 50;
    transition: all 0.3s ease;
    max-height: calc(100vh - 160px);
  }
  
  /* Constraint button to not overlap with footer */
  @media (max-height: 700px) {
    .mobile-filter-btn {
      bottom: 90px;
    }
  }
  
  @media (max-width: 1024px) {
    .mobile-filter-btn {
      display: block;
    }
  }
  
  @media (min-width: 1024px) {
    .mobile-filter-btn {
      display: none;
    }
  }
  
  /* Ensure button stays within safe area */
  @media (max-height: 600px) {
    .mobile-filter-btn {
      bottom: 60px;
    }
  }
  
  /* Adjust for very small screens */
  @media (max-width: 360px) {
    .mobile-filter-btn {
      right: 12px;
      bottom: 70px;
    }
  }
  
  /* Subtle floating animation */
  .mobile-filter-btn {
    animation: floatButton 3s ease-in-out infinite;
  }
  
  @keyframes floatButton {
    0%, 100% { 
      transform: translateY(0px);
    }
    50% { 
      transform: translateY(-3px);
    }
  }
  
  /* Override animation when footer is near */
  .mobile-filter-btn.near-footer {
    animation: none;
    pointer-events: none;
  }
  
  /* Ensure button doesn't interfere with footer interactions when hidden */
  .mobile-filter-btn[style*="visibility: hidden"] {
    pointer-events: none;
  }
  .slider-thumb::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #5A0117;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    position: relative;
    z-index: 2;
  }
  
  .slider-thumb::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #5A0117;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    position: relative;
    z-index: 2;
  }
  
  .slider-thumb:nth-child(2)::-webkit-slider-thumb {
    background: #8C6141;
  }
  
  .slider-thumb:nth-child(2)::-moz-range-thumb {
    background: #8C6141;
  }
  
  .slider-thumb::-webkit-slider-track {
    background: transparent;
    border: none;
  }
  
  .slider-thumb::-moz-range-track {
    background: transparent;
    border: none;
  }
  
  .slider-thumb:hover::-webkit-slider-thumb {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
  }
  
  .slider-thumb:hover::-moz-range-thumb {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
  }
`

// No caching - always fetch fresh data

function CategoryPageContent({ 
  categoryName, 
  displayName, 
  description, 
  icon, 
  subcategories = null,
  subcategoryType = null // 'mens-wear', 'womens-wear', 'kids-wear' for clothing subcategories
}) {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [sortBy, setSortBy] = useState("name")
  const [showFilters, setShowFilters] = useState(false)
  const [inStock, setInStock] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const itemsPerPage = 10
  
  // Filter button scroll state
  const [isNearFooter, setIsNearFooter] = useState(false)
  const [error, setError] = useState(null)

  // Handle URL search parameters
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search')
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm)
    }
  }, [searchParams])

  
  // Fetch initial data - always fresh
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`🆕 Fetching fresh ${categoryName} data from API`)
        console.log('📍 Fetch conditions:', {
          categoryName,
          timestamp: new Date().toISOString(),
          subcategoryType: subcategoryType || 'none'
        })
        
        // Fetch first page of products with pagination - with retry logic
        let retryCount = 0
        const maxRetries = 3
        let productsData = null
        
        // Build API URL based on category and subcategory
        // Use lowercase category name for API call as that's how they're stored in DB
        const categoryNameForAPI = categoryName.toLowerCase()
        let apiUrl = `/api/products?category=${categoryNameForAPI}&page=1&limit=${itemsPerPage}`
        if (subcategoryType) {
          // For subcategories like mens-wear, womens-wear, kids-wear
          apiUrl += `&subcategory=${subcategoryType}`
          console.log(`🎨 Fetching subcategory: ${subcategoryType} under ${categoryName}`)
        } else {
          console.log(`📚 Fetching all products for category: ${categoryName} (including child categories)`)
        }
        
        console.log(`🔗 API URL: ${apiUrl}`)
        
        while (retryCount < maxRetries && !productsData?.success) {
          try {
            const productsRes = await fetch(apiUrl, {
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            
            if (!productsRes.ok) {
              throw new Error(`HTTP error! status: ${productsRes.status}`)
            }
            
            productsData = await productsRes.json()
            
            if (productsData.success) {
              console.log(`✅ ${categoryName} products loaded successfully:`, productsData.products?.length || 0, 'products')
              
              // Set state
              setProducts(productsData.products || [])
              setTotalProducts(productsData.pagination?.totalCount || 0)
              setHasMore(productsData.pagination?.hasMore || false)
              setCurrentPage(1)
              
              break
            } else {
              console.warn(`⚠️ ${categoryName} products fetch failed (attempt ${retryCount + 1}):`, productsData.error)
            }
          } catch (fetchError) {
            console.error(`❌ ${categoryName} products fetch error (attempt ${retryCount + 1}):`, fetchError)
            retryCount++
            
            if (retryCount < maxRetries) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
        }
        
        // If all retries failed, show error state
        if (!productsData?.success) {
          console.error(`❌ Failed to load ${categoryName} products after all retries`)
          setProducts([]) // Ensure we don't show stale data
          setError(`Failed to load ${categoryName} products. Please refresh the page to try again.`)
        } else {
          setError(null) // Clear any previous errors
        }
        
      } catch (error) {
        console.error(`❌ Error in fetch${categoryName}Data:`, error)
        setProducts([])
        setError(`Something went wrong while loading ${categoryName} products. Please refresh the page.`)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [categoryName, subcategoryType])
  
  // Intersection Observer for footer detection
  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If footer is visible (intersecting with viewport), hide button
          setIsNearFooter(entry.isIntersecting)
        })
      },
      {
        // Trigger when footer starts becoming visible
        threshold: 0.1,
        // Add some margin to trigger earlier
        rootMargin: '50px 0px 0px 0px'
      }
    )
    
    observer.observe(footer)
    
    return () => {
      observer.disconnect()
    }
  }, [])

  // Function to reset all filters
  const resetAllFilters = () => {
    setSearchTerm("")
    setPriceRange({ min: 0, max: 10000 })
    setSortBy("name")
    setInStock(false)
  }

  // Function to load more products
  const loadMoreProducts = async () => {
    if (!hasMore || loadingMore) return
    
    try {
      setLoadingMore(true)
      const nextPage = currentPage + 1
      
      console.log(`📦 Loading more ${categoryName} products - page ${nextPage}`)
      
      // Use lowercase category name for API call
      const categoryNameForAPI = categoryName.toLowerCase()
      let apiUrl = `/api/products?category=${categoryNameForAPI}&page=${nextPage}&limit=${itemsPerPage}`
      if (subcategoryType) {
        apiUrl += `&subcategory=${subcategoryType}`
        console.log(`🎨 Loading more for subcategory: ${subcategoryType}`)
      } else {
        console.log(`📚 Loading more for category: ${categoryName} (all products)`)
      }
      
      console.log(`🔗 Load More API URL: ${apiUrl}`)
      
      const productsRes = await fetch(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const productsData = await productsRes.json()
      
      if (productsData.success) {
        const newProducts = [...products, ...productsData.products]
        setProducts(newProducts)
        setCurrentPage(nextPage)
        setHasMore(productsData.pagination?.hasMore || false)
        
        console.log(`📦 Loaded more ${categoryName} products - page ${nextPage}`)
        console.log(`📊 Pagination:`, {
          currentPage: nextPage,
          totalProducts: productsData.pagination?.totalCount || totalProducts,
          hasMore: productsData.pagination?.hasMore || false
        })
      } else {
        console.error(`⚠️ Failed to load more ${categoryName} products:`, productsData.error)
      }
    } catch (error) {
      console.error(`Error loading more ${categoryName} products:`, error)
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPrice =
      (priceRange.min === 0 || product.price >= priceRange.min) &&
      (priceRange.max === 10000 || product.price <= priceRange.max)

    const matchesStock = !inStock || product.stock > 0

    return matchesSearch && matchesPrice && matchesStock
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.name.localeCompare(b.name)
      case "newest":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom CSS Styles */}
      <style dangerouslySetInnerHTML={{__html: sliderStyles}} />
      <Header />
      
      {/* Mobile Filter Overlay */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowFilters(false)}
          ></div>
          
          {/* Filter Panel */}
          <div className="relative ml-auto h-full w-full max-w-sm bg-white shadow-xl transform transition-transform">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Clear All Button */}
                  <button
                    onClick={resetAllFilters}
                    className="w-full text-sm px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "#8C6141", color: "white", fontFamily: "Montserrat, sans-serif" }}
                  >
                    Clear All Filters
                  </button>

                  {/* Search Bar */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Search Products
                    </label>
                    <input
                      type="text"
                      placeholder={`Search ${displayName.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        focusRingColor: "#5A0117",
                      }}
                    />
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Price Range
                    </label>
                    <div className="space-y-5">
                      {/* Price Display */}
                      <div className="flex justify-between items-center py-2">
                        <div className="bg-gray-100 px-3 py-2 rounded-lg">
                          <span className="text-sm font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            ₹{priceRange.min.toLocaleString()}
                          </span>
                        </div>
                        <div className="mx-2 text-gray-400">-</div>
                        <div className="bg-gray-100 px-3 py-2 rounded-lg">
                          <span className="text-sm font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                            ₹{priceRange.max === 10000 ? '10,000+' : priceRange.max.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Dual Range Slider */}
                      <div className="relative py-4">
                        <div className="slider-track h-2 bg-gray-200 rounded-lg relative">
                          <div 
                            className="slider-range h-2 rounded-lg absolute"
                            style={{
                              background: 'linear-gradient(90deg, #5A0117 0%, #8C6141 100%)',
                              left: `${(priceRange.min / 10000) * 100}%`,
                              right: `${100 - (priceRange.max / 10000) * 100}%`
                            }}
                          ></div>
                        </div>
                        
                        {/* Min Range Input */}
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange.min}
                          onChange={(e) => {
                            const newMin = Math.min(Number(e.target.value), priceRange.max - 100)
                            setPriceRange({ ...priceRange, min: newMin })
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb top-4"
                          style={{
                            background: 'transparent',
                            pointerEvents: 'auto'
                          }}
                        />
                        
                        {/* Max Range Input */}
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange.max}
                          onChange={(e) => {
                            const newMax = Math.max(Number(e.target.value), priceRange.min + 100)
                            setPriceRange({ ...priceRange, max: newMax })
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb top-4"
                          style={{
                            background: 'transparent',
                            pointerEvents: 'auto'
                          }}
                        />
                      </div>
                      
                      {/* Price Markers */}
                      <div className="flex justify-between text-xs pt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        <span>₹0</span>
                        <span>₹2.5K</span>
                        <span>₹5K</span>
                        <span>₹7.5K</span>
                        <span>₹10K+</span>
                      </div>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    >
                      <option value="name">Name A-Z</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Availability
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="inStockMobile"
                        checked={inStock}
                        onChange={(e) => setInStock(e.target.checked)}
                        className="mr-3 h-5 w-5 rounded focus:ring-2 focus:ring-opacity-50"
                        style={{ accentColor: "#5A0117" }}
                      />
                      <label
                        htmlFor="inStockMobile"
                        className="text-sm cursor-pointer"
                        style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                      >
                        In Stock Only
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Apply Button */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Page Header */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-white" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              {icon} {displayName}
            </h1>
            <p className="text-xl opacity-90" style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>
              {description}
            </p>
          </div>
        </section>

        {/* Subcategories Section (if provided) */}
        {subcategories && (
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                Shop by Category
              </h2>
              <div className={`grid grid-cols-1 ${subcategories.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6 mb-12`}>
                {subcategories}
              </div>
            </div>
          </section>
        )}

        {/* Main Content with Sidebar */}
        <section className="py-8 relative min-h-screen">
          <div className="w-full">
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar - Filters */}
              <aside className="lg:w-80 flex-shrink-0 px-4 sm:px-6 lg:px-8">
                {/* Filters Container - Desktop Only */}
                <div className="hidden lg:block bg-white rounded-lg shadow-lg border p-6 sticky top-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                      Filters
                    </h3>
                    <button
                      onClick={resetAllFilters}
                      className="text-sm px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "#8C6141", color: "white", fontFamily: "Montserrat, sans-serif" }}
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Search Bar */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Search Products
                      </label>
                      <input
                        type="text"
                        placeholder={`Search ${displayName.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{
                          fontFamily: "Montserrat, sans-serif",
                          focusRingColor: "#5A0117",
                        }}
                      />
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-semibold mb-4" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Price Range
                      </label>
                      <div className="space-y-5">
                        {/* Price Display */}
                        <div className="flex justify-between items-center py-2">
                          <div className="bg-gray-100 px-3 py-2 rounded-lg">
                            <span className="text-sm font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              ₹{priceRange.min.toLocaleString()}
                            </span>
                          </div>
                          <div className="mx-2 text-gray-400">-</div>
                          <div className="bg-gray-100 px-3 py-2 rounded-lg">
                            <span className="text-sm font-bold" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                              ₹{priceRange.max === 10000 ? '10,000+' : priceRange.max.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Dual Range Slider */}
                        <div className="relative py-4">
                          <div className="slider-track h-2 bg-gray-200 rounded-lg relative">
                            <div 
                              className="slider-range h-2 rounded-lg absolute"
                              style={{
                                background: 'linear-gradient(90deg, #5A0117 0%, #8C6141 100%)',
                                left: `${(priceRange.min / 10000) * 100}%`,
                                right: `${100 - (priceRange.max / 10000) * 100}%`
                              }}
                            ></div>
                          </div>
                          
                          {/* Min Range Input */}
                          <input
                            type="range"
                            min="0"
                            max="10000"
                            step="100"
                            value={priceRange.min}
                            onChange={(e) => {
                              const newMin = Math.min(Number(e.target.value), priceRange.max - 100)
                              setPriceRange({ ...priceRange, min: newMin })
                            }}
                            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb top-4"
                            style={{
                              background: 'transparent',
                              pointerEvents: 'auto'
                            }}
                          />
                          
                          {/* Max Range Input */}
                          <input
                            type="range"
                            min="0"
                            max="10000"
                            step="100"
                            value={priceRange.max}
                            onChange={(e) => {
                              const newMax = Math.max(Number(e.target.value), priceRange.min + 100)
                              setPriceRange({ ...priceRange, max: newMax })
                            }}
                            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb top-4"
                            style={{
                              background: 'transparent',
                              pointerEvents: 'auto'
                            }}
                          />
                        </div>
                        
                        {/* Price Markers */}
                        <div className="flex justify-between text-xs pt-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                          <span>₹0</span>
                          <span>₹2.5K</span>
                          <span>₹5K</span>
                          <span>₹7.5K</span>
                          <span>₹10K+</span>
                        </div>
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                      >
                        <option value="name">Name A-Z</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </div>

                    {/* Availability Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Availability
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="inStock"
                          checked={inStock}
                          onChange={(e) => setInStock(e.target.checked)}
                          className="mr-3 h-5 w-5 rounded focus:ring-2 focus:ring-opacity-50"
                          style={{ accentColor: "#5A0117" }}
                        />
                        <label
                          htmlFor="inStock"
                          className="text-sm cursor-pointer"
                          style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}
                        >
                          In Stock Only
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Content - Products */}
              <main className="flex-1 px-4 sm:px-6 lg:px-8 relative">
                {/* Mobile Filter Button - Dynamic positioned based on scroll */}
                <div 
                  className={`mobile-filter-btn ${isNearFooter ? 'near-footer' : ''}`}
                  style={{
                    opacity: isNearFooter ? '0' : '1',
                    visibility: isNearFooter ? 'hidden' : 'visible',
                    transform: isNearFooter ? 'translateY(20px) scale(0.8)' : 'translateY(0) scale(1)',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease'
                  }}
                >
                  <button
                    onClick={() => setShowFilters(true)}
                    className="group p-4 rounded-full shadow-2xl border-2 transition-all duration-300 hover:scale-110 active:scale-95 transform backdrop-blur-sm"
                    style={{ 
                      backgroundColor: '#5A0117',
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(90, 1, 23, 0.5)'
                    }}
                  >
                    <div className="relative">
                      <svg className="w-6 h-6 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      
                      {/* Floating badge for filters count */}
                      {(searchTerm || priceRange.min !== 0 || priceRange.max !== 10000 || inStock) && (
                        <div 
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
                          style={{ backgroundColor: '#8C6141', color: 'white' }}
                        >
                          {[
                            searchTerm && '1', 
                            (priceRange.min !== 0 || priceRange.max !== 10000) && '1',
                            inStock && '1'
                          ].filter(Boolean).length}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                
                {loading ? (
                  <>
                    {/* Loading Header Skeleton */}
                    <div className="mb-8">
                      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                    </div>
                    
                    {/* Products Grid Skeleton */}
                    <ProductGridSkeleton itemsPerRow={5} rows={2} />
                  </>
                ) : sortedProducts.length > 0 ? (
                  <>
                    {/* Results Header */}
                    <div className="mb-8 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                            {icon} {displayName} Collection
                          </h2>
                        </div>
                        
                        {/* Show total products count */}
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm lg:text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            {(searchTerm || priceRange.min !== 0 || priceRange.max !== 10000 || inStock) ? (
                              `Showing ${sortedProducts.length} of ${products.length} products (${totalProducts} total available)`
                            ) : (
                              `Showing ${products.length} of ${totalProducts} products`
                            )}
                          </p>
                        </div>
                        
                        {(searchTerm || priceRange.min !== 0 || priceRange.max !== 10000 || inStock) && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1.5 rounded-full font-medium shadow-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                              ✨ Filters applied
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-6">
                      {sortedProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                    
                    {/* Load More Button - Only show when no filters applied and there are more products to load */}
                    {!searchTerm && priceRange.min === 0 && priceRange.max === 10000 && !inStock && (
                      <div className="mt-12 text-center">
                        {loadingMore ? (
                          <>
                            {/* Loading More Skeleton */}
                            <div className="mb-6">
                              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-6">
                                <ProductSkeleton count={itemsPerPage} />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-center gap-3 py-4">
                              <div className="w-6 h-6 border-3 border-gray-300 border-t-[#5A0117] rounded-full animate-spin"></div>
                              <span className="text-lg font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                                Loading more products...
                              </span>
                            </div>
                          </>
                        ) : hasMore ? (
                          <button
                            onClick={loadMoreProducts}
                            className="group relative px-8 py-4 bg-white border-2 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl transform"
                            style={{ 
                              borderColor: "#5A0117", 
                              color: "#5A0117",
                              fontFamily: "Sugar, serif"
                            }}
                         
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              Load More Products
                              <svg className="w-5 h-5 transition-transform group-hover:translate-y-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                            
                            {/* Gradient background effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-xl"></div>
                          </button>
                        ) : (
                          <div className="py-8">
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="font-medium" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                                All products loaded
                              </span>
                            </div>
                            <p className="mt-2 text-sm opacity-70" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                              You&apos;ve seen all {totalProducts} products in our {displayName.toLowerCase()} collection
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : error ? (
                  /* Error State */
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-4">⚠️</div>
                      <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        Something went wrong
                      </h3>
                      <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        {error}
                      </p>
                      <button
                        onClick={() => {
                          window.location.reload()
                        }}
                        className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        🔄 Refresh Page
                      </button>
                    </div>
                  </div>
                ) : products.length === 0 && !loading ? (
                  /* No Products State - Only show if we have no products and not loading */
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-4">{icon}</div>
                      <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        No {displayName.toLowerCase()} products available
                      </h3>
                      <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        It looks like there are no {displayName.toLowerCase()} products in our catalog at the moment. Please check back later!
                      </p>
                      <button
                        onClick={() => {
                          window.location.reload()
                        }}
                        className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        🔄 Refresh Page
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No products found after filtering */
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        No products found
                      </h3>
                      <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        Try adjusting your search or filter criteria to find what you are looking for
                      </p>
                      <button
                        onClick={resetAllFilters}
                        className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

// Loading component for Suspense fallback
function CategoryPageLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="animate-pulse">
        <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300"></div>
        <div className="p-8">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main CategoryPage component with Suspense boundary
export default function CategoryPage(props) {
  return (
    <Suspense fallback={<CategoryPageLoading />}>
      <CategoryPageContent {...props} />
    </Suspense>
  )
}
