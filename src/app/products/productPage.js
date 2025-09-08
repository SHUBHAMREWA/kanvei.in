"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import ProductCard from "../../components/ProductCard"
import { ProductGridSkeleton } from "../../components/ProductSkeleton"
import ProductSkeleton from "../../components/ProductSkeleton"

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

// Cache configuration
const CACHE_KEY = 'kanvei_products_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
const CATEGORIES_CACHE_KEY = 'kanvei_categories_cache'
const PAGE_ENTRY_KEY = 'kanvei_page_entry_method'
const LAST_NAVIGATION_KEY = 'kanvei_last_navigation'

// Enhanced cache utility functions
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      console.log(`📭 No cache found for ${key}`)
      return null
    }
    
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    const age = now - timestamp
    
    // Check if cache is still valid (within 5 minutes)
    if (age < CACHE_DURATION) {
      const remainingTime = Math.round((CACHE_DURATION - age) / 1000)
      console.log(`✅ Using cached data for ${key} (${remainingTime}s remaining)`)
      return data
    } else {
      console.log(`⏰ Cache expired for ${key} (${Math.round(age / 1000)}s old), removing...`)
      localStorage.removeItem(key)
      return null
    }
  } catch (error) {
    console.error(`❌ Error reading cache for ${key}:`, error)
    localStorage.removeItem(key)
    return null
  }
}

const setCachedData = (key, data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now(),
      version: '1.0' // For future cache invalidation if needed
    }
    localStorage.setItem(key, JSON.stringify(cacheObject))
    console.log(`💾 Cached data for ${key} (${JSON.stringify(cacheObject).length} bytes)`)
  } catch (error) {
    console.error(`❌ Error caching data for ${key}:`, error)
    // If quota exceeded, clear old cache and try again
    if (error.name === 'QuotaExceededError') {
      console.log('💿 Storage quota exceeded, clearing cache...')
      clearProductsCache()
      try {
        localStorage.setItem(key, JSON.stringify(cacheObject))
        console.log(`💾 Cached data for ${key} after cleanup`)
      } catch (retryError) {
        console.error(`❌ Failed to cache even after cleanup:`, retryError)
      }
    }
  }
}

const clearProductsCache = () => {
  const keys = [CACHE_KEY, CATEGORIES_CACHE_KEY]
  keys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
      console.log(`🗑️ Cleared cache for ${key}`)
    }
  })
  console.log('🧹 All products cache cleared')
}

// Expose globally for cart operations
if (typeof window !== 'undefined') {
  window.clearProductsCache = clearProductsCache
}

// Enhanced manual page refresh detection
const detectPageRefresh = () => {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    const now = Date.now()
    const currentUrl = window.location.href
    
    // Method 1: Check navigation type using Performance API (modern browsers)
    let wasRefreshed = false
    
    // Try modern Navigation API first
    if ('navigation' in window && window.navigation.currentEntry) {
      const entry = window.navigation.currentEntry
      wasRefreshed = entry.index === 0 // First entry after refresh
    }
    // Fallback to Performance API
    else if (window.performance?.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation')
      if (navigationEntries.length > 0) {
        wasRefreshed = navigationEntries[0].type === 'reload'
      }
    }
    // Legacy fallback
    else if (window.performance?.navigation) {
      wasRefreshed = window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD
    }
    
    // Method 2: Check session storage for navigation tracking
    const lastNavigation = sessionStorage.getItem(LAST_NAVIGATION_KEY)
    const pageEntryMethod = sessionStorage.getItem(PAGE_ENTRY_KEY)
    
    // If no previous navigation record, this is likely a fresh page load/refresh
    if (!lastNavigation && !pageEntryMethod) {
      wasRefreshed = true
    }
    
    // Method 3: Check if page was accessed directly (no referrer from same origin)
    if (!wasRefreshed && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer)
        const currentUrlObj = new URL(currentUrl)
        // If referrer is from different origin or different path, it's navigation
        if (referrerUrl.origin === currentUrlObj.origin && referrerUrl.pathname !== currentUrlObj.pathname) {
          wasRefreshed = false // This is navigation between pages
        }
      } catch (e) {
        // Invalid referrer URL, treat as refresh
        wasRefreshed = true
      }
    }
    
    if (wasRefreshed) {
      console.log('🔄 Manual page refresh detected - clearing cache for fresh data')
      console.log('📍 Detection methods:', {
        navigationAPI: 'navigation' in window,
        performanceAPI: !!window.performance?.getEntriesByType,
        referrer: document.referrer,
        pageEntry: pageEntryMethod
      })
      
      clearProductsCache()
      
      // Clear session indicators
      sessionStorage.removeItem(PAGE_ENTRY_KEY)
      sessionStorage.removeItem(LAST_NAVIGATION_KEY)
      
      // Mark this as a refresh
      sessionStorage.setItem(PAGE_ENTRY_KEY, JSON.stringify({
        type: 'refresh',
        timestamp: now,
        url: currentUrl
      }))
      
      return true
    } else {
      console.log('🧭 Page navigation detected - cache will be used if available')
      
      // Mark this as navigation
      sessionStorage.setItem(PAGE_ENTRY_KEY, JSON.stringify({
        type: 'navigation',
        timestamp: now,
        url: currentUrl,
        referrer: document.referrer
      }))
    }
    
    // Update last navigation timestamp
    sessionStorage.setItem(LAST_NAVIGATION_KEY, now.toString())
    
    return false
    
  } catch (error) {
    console.error('❌ Error in refresh detection:', error)
    // On error, assume refresh to be safe and fetch fresh data
    clearProductsCache()
    return true
  }
}

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [usingCache, setUsingCache] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  // Handle URL search parameters
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search')
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm)
    }
  }, [searchParams])

  // Fetch initial data with caching
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setUsingCache(false)
        setError(null)
        
        // Detect manual page refresh and clear cache if needed
        const wasRefreshed = detectPageRefresh()
        
        // Check for cached products first (only if not refreshed)
        let cachedProducts = null
        let cachedCategories = null
        
        if (!wasRefreshed) {
          cachedProducts = getCachedData(CACHE_KEY)
          cachedCategories = getCachedData(CATEGORIES_CACHE_KEY)
        }
        
        if (cachedProducts && cachedCategories && !wasRefreshed) {
          // Use cached data immediately
          console.log('🚀 Loading from cache - no API calls needed!')
          console.log('📊 Cache data:', {
            products: cachedProducts.products?.length || 0,
            categories: cachedCategories?.length || 0,
            totalProducts: cachedProducts.pagination?.totalCount || 0
          })
          
          setProducts(cachedProducts.products || [])
          setTotalProducts(cachedProducts.pagination?.totalCount || 0)
          setHasMore(cachedProducts.pagination?.hasMore || false)
          setCurrentPage(cachedProducts.pagination?.currentPage || 1)
          setCategories(cachedCategories || [])
          setUsingCache(true) // Only show when loading from initial cache
          setError(null)
          setLoading(false)
          return // Exit early, no API calls needed!
        }
        
        // Log reason for fresh data fetch with detailed info
        const reasonForFresh = []
        if (wasRefreshed) {
          reasonForFresh.push('page was manually refreshed')
        }
        if (!cachedProducts) {
          reasonForFresh.push('no products cache found')
        }
        if (!cachedCategories) {
          reasonForFresh.push('no categories cache found')
        }
        
        console.log(`🆕 Fetching fresh data - reason: ${reasonForFresh.join(', ')}`)
        console.log('📍 Fetch conditions:', {
          wasRefreshed,
          hasProductsCache: !!cachedProducts,
          hasCategoriesCache: !!cachedCategories,
          timestamp: new Date().toISOString()
        })
        
        // Fetch first page of products with pagination - with retry logic
        let retryCount = 0
        const maxRetries = 3
        let productsData = null
        
        while (retryCount < maxRetries && !productsData?.success) {
          try {
            const productsRes = await fetch(`/api/products?page=1&limit=${itemsPerPage}`, {
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            
            if (!productsRes.ok) {
              throw new Error(`HTTP error! status: ${productsRes.status}`)
            }
            
            productsData = await productsRes.json()
            
            if (productsData.success) {
              console.log('✅ Products loaded successfully:', productsData.products?.length || 0, 'products')
              
              // Set state
              setProducts(productsData.products || [])
              setTotalProducts(productsData.pagination?.totalCount || 0)
              setHasMore(productsData.pagination?.hasMore || false)
              setCurrentPage(1)
              
              // Cache the successful response
              setCachedData(CACHE_KEY, {
                products: productsData.products || [],
                pagination: productsData.pagination
              })
              
              break
            } else {
              console.warn(`⚠️ Products fetch failed (attempt ${retryCount + 1}):`, productsData.error)
            }
          } catch (fetchError) {
            console.error(`❌ Products fetch error (attempt ${retryCount + 1}):`, fetchError)
            retryCount++
            
            if (retryCount < maxRetries) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
        }
        
        // If all retries failed, show error state
        if (!productsData?.success) {
          console.error('❌ Failed to load products after all retries')
          setProducts([]) // Ensure we don't show stale data
          setError('Failed to load products. Please refresh the page to try again.')
        } else {
          setError(null) // Clear any previous errors
        }

        // Fetch categories (with similar retry logic)
        if (!cachedCategories) {
          try {
            const categoriesRes = await fetch("/api/categories", {
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            const categoriesData = await categoriesRes.json()
            
            if (categoriesData.success) {
              setCategories(categoriesData.categories || [])
              // Cache categories too
              setCachedData(CATEGORIES_CACHE_KEY, categoriesData.categories || [])
            } else {
              console.warn('⚠️ Categories fetch failed:', categoriesData.error)
              setCategories([])
            }
          } catch (categoriesError) {
            console.error('❌ Categories fetch error:', categoriesError)
            setCategories([])
          }
        }
        
      } catch (error) {
        console.error("❌ Error in fetchInitialData:", error)
        setProducts([])
        setCategories([])
        setError('Something went wrong while loading products. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])
  
  // Watch for filter changes and trigger API calls
  useEffect(() => {
    // Skip initial render and only trigger when filters actually change
    if (loading) return
    
    const isAnyFilterActive = hasActiveFilters()
    
    if (isAnyFilterActive) {
      console.log('🔍 Filter changed, fetching filtered products...')
      setCurrentPage(1) // Reset to first page
      fetchProducts(true, 1, false)
    }
  }, [selectedCategory, searchTerm, priceRange, sortBy, inStock])
  
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

  // Check if any filters are currently applied
  const hasActiveFilters = () => {
    return (
      selectedCategory !== "" ||
      searchTerm !== "" ||
      priceRange.min !== 0 ||
      priceRange.max !== 10000 ||
      sortBy !== "name" ||
      inStock === true
    )
  }
  
  // Function to reset all filters and restore cache
  const resetAllFilters = async () => {
    console.log('🔄 Clearing all filters...')
    setSelectedCategory("")
    setSearchTerm("")
    setPriceRange({ min: 0, max: 10000 })
    setSortBy("name")
    setInStock(false)
    setCurrentPage(1)
    setIsFiltering(false)
    
    // Try to restore from cache first
    const cachedProducts = getCachedData(CACHE_KEY)
    if (cachedProducts && cachedProducts.products) {
      console.log('📦 Restoring products from cache after filter clear')
      setProducts(cachedProducts.products)
      setTotalProducts(cachedProducts.pagination?.totalCount || 0)
      setHasMore(cachedProducts.pagination?.hasMore || false)
      setCurrentPage(cachedProducts.pagination?.currentPage || 1)
      // Don't show cached indicator when manually restoring from cache after filter clear
      setUsingCache(false)
    } else {
      // If no cache, fetch fresh data
      console.log('🆕 No cache available, fetching fresh data after filter clear')
      await fetchProducts(false)
    }
    // Ensure cached indicator is hidden after filter clear
    setUsingCache(false)
  }
  
  // New function to fetch products with or without filters
  const fetchProducts = async (withFilters = false, page = 1, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      // Build API URL with filters
      let apiUrl = `/api/products?page=${page}&limit=${itemsPerPage}`
      
      if (withFilters || hasActiveFilters()) {
        console.log('🔍 Fetching products with filters...')
        setIsFiltering(true)
        setUsingCache(false)
        
        // Add filter parameters
        if (selectedCategory) {
          apiUrl += `&category=${encodeURIComponent(selectedCategory.toLowerCase())}`
        }
        if (searchTerm) {
          apiUrl += `&search=${encodeURIComponent(searchTerm)}`
        }
        if (priceRange.min > 0) {
          apiUrl += `&priceMin=${priceRange.min}`
        }
        if (priceRange.max < 10000) {
          apiUrl += `&priceMax=${priceRange.max}`
        }
        if (inStock) {
          apiUrl += `&inStock=true`
        }
        if (sortBy && sortBy !== 'name') {
          apiUrl += `&sortBy=${sortBy}`
        }
        
        console.log('📡 Filter API URL:', apiUrl)
      } else {
        console.log('📦 Fetching products without filters (can use cache)')
        setIsFiltering(false)
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Cache-Control': withFilters || hasActiveFilters() ? 'no-cache' : 'default',
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (loadMore) {
          // Append to existing products
          const newProducts = [...products, ...data.products]
          setProducts(newProducts)
        } else {
          // Replace products
          setProducts(data.products)
        }
        
        setTotalProducts(data.pagination?.totalCount || 0)
        setHasMore(data.pagination?.hasMore || false)
        setCurrentPage(page)
        setError(null)
        
        // Only cache if no filters applied
        if (!withFilters && !hasActiveFilters() && !loadMore) {
          console.log('💾 Caching unfiltered products')
          setCachedData(CACHE_KEY, {
            products: data.products,
            pagination: data.pagination
          })
        }
        // Never show cached indicator when making fresh API calls
        setUsingCache(false)
        
        console.log(`✅ Products loaded: ${data.products.length} (page ${page})`)
        console.log('📊 Pagination:', data.pagination)
      } else {
        console.error('❌ Failed to fetch products:', data.error)
        setError(data.error || 'Failed to fetch products')
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      setError('Failed to fetch products. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }
  
  // Function to force refresh cache
  const refreshCache = async () => {
    console.log('🔄 Force refreshing cache...')
    clearProductsCache()
    setLoading(true)
    setError(null)
    setUsingCache(false)
    
    // Re-run the fetch logic
    const fetchData = async () => {
      // This will now fetch fresh data since cache is cleared
      window.location.reload()
    }
    
    fetchData()
  }

  // Function to load more products with filtering support
  const loadMoreProducts = async () => {
    if (!hasMore || loadingMore) return
    
    const nextPage = currentPage + 1
    console.log(`📦 Loading more products - page ${nextPage} (filtering: ${isFiltering})`)
    
    await fetchProducts(isFiltering, nextPage, true)
  }

  // Products are now pre-filtered and sorted by the API
  const displayProducts = products

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
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        focusRingColor: "#5A0117",
                      }}
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 text-white" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              Shop All Products
            </h1>
            <p className="text-xl opacity-90" style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>
              Discover our complete collection with advanced filtering options
            </p>
          </div>
        </section> */}


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
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{
                          fontFamily: "Montserrat, sans-serif",
                          focusRingColor: "#5A0117",
                        }}
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "Montserrat, sans-serif", color: "#5A0117" }}>
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                        style={{ fontFamily: "Montserrat, sans-serif", focusRingColor: "#5A0117" }}
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
                      {(selectedCategory || searchTerm || priceRange.min !== 0 || priceRange.max !== 10000 || inStock) && (
                        <div 
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold animate-pulse"
                          style={{ backgroundColor: '#8C6141', color: 'white' }}
                        >
                          {[
                            selectedCategory && '1',
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
                ) : displayProducts.length > 0 ? (
                  <>
                    {/* Results Header */}
                    <div className="mb-8 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          🛍️ Products Collection
                        </h2>
                        
                        {/* Show total products count with filtering status */}
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm lg:text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                            {isFiltering ? (
                              `Showing ${displayProducts.length} filtered results of ${totalProducts} total products`
                            ) : (
                              `Showing ${displayProducts.length} of ${totalProducts} products`
                            )}
                          </p>
                          
                          
                          {isFiltering && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium" style={{ fontFamily: "Montserrat, sans-serif" }}>
                              🔍 Filtered
                            </span>
                          )}
                        </div>
                        
                        {hasActiveFilters() && (
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
                      {displayProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                    
                    {/* Load More Button - Show when there are more products to load */}
                    {(
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
                              You&apos;ve seen all {totalProducts} products in our collection
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
                          setIsRefreshing(true)
                          window.location.reload()
                        }}
                        disabled={isRefreshing}
                        className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        {isRefreshing ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Refreshing...
                          </span>
                        ) : (
                          '🔄 Refresh Page'
                        )}
                      </button>
                    </div>
                  </div>
                ) : products.length === 0 && !loading ? (
                  /* No Products State - Only show if we have no products and not loading */
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-4">🛍️</div>
                      <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        No products available
                      </h3>
                      <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        It looks like there are no products in our catalog at the moment. Please check back later!
                      </p>
                      <button
                        onClick={() => {
                          setIsRefreshing(true)
                          window.location.reload()
                        }}
                        disabled={isRefreshing}
                        className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        {isRefreshing ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Refreshing...
                          </span>
                        ) : (
                          '🔄 Refresh Page'
                        )}
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
