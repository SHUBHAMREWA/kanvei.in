"use client"
import { useState, useEffect } from "react"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import CategoryCard from "../../components/CategoryCard"

// Cache configuration for categories page
const CATEGORIES_CACHE_KEY = 'kanvei_main_categories_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const PAGE_ENTRY_KEY = 'kanvei_categories_page_entry'
const LAST_NAVIGATION_KEY = 'kanvei_categories_last_navigation'

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
    
    if (age < CACHE_DURATION) {
      const remainingTime = Math.round((CACHE_DURATION - age) / 1000)
      console.log(`✅ Using cached categories (${remainingTime}s remaining)`)
      return data
    } else {
      console.log(`⏰ Categories cache expired (${Math.round(age / 1000)}s old), removing...`)
      localStorage.removeItem(key)
      return null
    }
  } catch (error) {
    console.error(`❌ Error reading categories cache:`, error)
    localStorage.removeItem(key)
    return null
  }
}

const setCachedData = (key, data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    }
    localStorage.setItem(key, JSON.stringify(cacheObject))
    console.log(`💾 Cached categories data (${JSON.stringify(cacheObject).length} bytes)`)
  } catch (error) {
    console.error(`❌ Error caching categories:`, error)
    if (error.name === 'QuotaExceededError') {
      console.log('💿 Storage quota exceeded, clearing cache...')
      localStorage.removeItem(key)
    }
  }
}

const clearCategoriesCache = () => {
  localStorage.removeItem(CATEGORIES_CACHE_KEY)
  console.log('🗑️ Categories cache cleared')
}

// Manual page refresh detection
const detectPageRefresh = () => {
  if (typeof window === 'undefined') return false
  
  try {
    const now = Date.now()
    let wasRefreshed = false
    
    // Check navigation type
    if ('navigation' in window && window.navigation.currentEntry) {
      wasRefreshed = window.navigation.currentEntry.index === 0
    } else if (window.performance?.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation')
      if (navigationEntries.length > 0) {
        wasRefreshed = navigationEntries[0].type === 'reload'
      }
    } else if (window.performance?.navigation) {
      wasRefreshed = window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD
    }
    
    // Check session storage
    const lastNavigation = sessionStorage.getItem(LAST_NAVIGATION_KEY)
    const pageEntryMethod = sessionStorage.getItem(PAGE_ENTRY_KEY)
    
    if (!lastNavigation && !pageEntryMethod) {
      wasRefreshed = true
    }
    
    if (wasRefreshed) {
      console.log('🔄 Manual page refresh detected - clearing categories cache')
      clearCategoriesCache()
      
      sessionStorage.removeItem(PAGE_ENTRY_KEY)
      sessionStorage.removeItem(LAST_NAVIGATION_KEY)
      
      sessionStorage.setItem(PAGE_ENTRY_KEY, JSON.stringify({
        type: 'refresh',
        timestamp: now,
        page: 'categories'
      }))
      
      return true
    } else {
      console.log('🧭 Categories page navigation detected - cache will be used if available')
      
      sessionStorage.setItem(PAGE_ENTRY_KEY, JSON.stringify({
        type: 'navigation',
        timestamp: now,
        page: 'categories',
        referrer: document.referrer
      }))
    }
    
    sessionStorage.setItem(LAST_NAVIGATION_KEY, now.toString())
    return false
    
  } catch (error) {
    console.error('❌ Error in categories refresh detection:', error)
    clearCategoriesCache()
    return true
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setUsingCache(false)
        setError(null)
        
        // Detect manual page refresh
        const wasRefreshed = detectPageRefresh()
        
        // Check for cached categories
        let cachedCategories = null
        if (!wasRefreshed) {
          cachedCategories = getCachedData(CATEGORIES_CACHE_KEY)
        }
        
        if (cachedCategories && !wasRefreshed) {
          console.log('🚀 Loading categories from cache - no API calls needed!')
          console.log('📊 Cached categories:', cachedCategories.length || 0)
          
          setCategories(cachedCategories)
          setUsingCache(true)
          setError(null)
          setLoading(false)
          return
        }
        
        // Fetch fresh data
        console.log(`🆕 Fetching fresh categories - reason: ${wasRefreshed ? 'page refreshed' : 'no cache found'}`)
        
        let retryCount = 0
        const maxRetries = 3
        let categoriesData = null
        
        while (retryCount < maxRetries && !categoriesData?.success) {
          try {
            const res = await fetch("/api/categories?withHierarchy=true", {
              headers: {
                'Cache-Control': 'no-cache',
              }
            })
            
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`)
            }
            
            categoriesData = await res.json()
            
            if (categoriesData.success) {
              console.log('✅ Categories loaded successfully:', categoriesData.categories?.length || 0, 'categories')
              
              setCategories(categoriesData.categories || [])
              
              // Cache the response
              setCachedData(CATEGORIES_CACHE_KEY, categoriesData.categories || [])
              
              break
            } else {
              console.warn(`⚠️ Categories fetch failed (attempt ${retryCount + 1}):`, categoriesData.error)
            }
          } catch (fetchError) {
            console.error(`❌ Categories fetch error (attempt ${retryCount + 1}):`, fetchError)
            retryCount++
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
        }
        
        if (!categoriesData?.success) {
          console.error('❌ Failed to load categories after all retries')
          setCategories([])
          setError('Failed to load categories. Please refresh the page to try again.')
        } else {
          setError(null)
        }
        
      } catch (error) {
        console.error("❌ Error in fetchCategories:", error)
        setCategories([])
        setError('Something went wrong while loading categories. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-white" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              Categories
            </h1>
            <p className="text-xl opacity-90" style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>
              Browse our carefully curated product categories
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-48 sm:h-56 lg:h-64 animate-pulse"></div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category._id} category={category} />
                ))}
              </div>
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
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                  >
                    🔄 Refresh Page
                  </button>
                </div>
              </div>
            ) : (
              /* No categories state */
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  No categories found
                </h3>
                <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Categories will appear here once they are added
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  🔄 Refresh Page
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
