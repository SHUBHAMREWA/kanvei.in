"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import ProductCard from "../../components/ProductCard"

// Custom styles for dual range slider
const sliderStyles = `
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

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [sortBy, setSortBy] = useState("name")
  const [showFilters, setShowFilters] = useState(false)
  const [inStock, setInStock] = useState(false)

  // Handle URL search parameters
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search')
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch("/api/products")
        const productsData = await productsRes.json()
        if (productsData.success) {
          setProducts(productsData.products)
        }

        // Fetch categories
        const categoriesRes = await fetch("/api/categories")
        const categoriesData = await categoriesRes.json()
        if (categoriesData.success) {
          setCategories(categoriesData.categories)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPrice =
      (priceRange.min === 0 || product.price >= priceRange.min) &&
      (priceRange.max === 10000 || product.price <= priceRange.max)

    const matchesStock = !inStock || product.stock > 0

    return matchesCategory && matchesSearch && matchesPrice && matchesStock
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
                    onClick={() => {
                      setSelectedCategory("")
                      setSearchTerm("")
                      setPriceRange({ min: 0, max: 10000 })
                      setSortBy("name")
                      setInStock(false)
                    }}
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
        <section className="py-8">
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
                      onClick={() => {
                        setSelectedCategory("")
                        setSearchTerm("")
                        setPriceRange({ min: 0, max: 10000 })
                        setSortBy("name")
                        setInStock(false)
                      }}
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
              <main className="flex-1 px-4 sm:px-6 lg:px-8">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl h-72 animate-pulse shadow-md"></div>
                    ))}
                  </div>
                ) : sortedProducts.length > 0 ? (
                  <>
                    {/* Results Header */}
                    <div className="mb-8 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                          🛍️ Products Collection
                        </h2>
                        {(selectedCategory || searchTerm || priceRange.min !== 0 || priceRange.max !== 10000 || inStock) && (
                          <>
                            <p className="text-sm lg:text-lg mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                              Showing {sortedProducts.length} of {products.length} products
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1.5 rounded-full font-medium shadow-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                                ✨ Filters applied
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Mobile Filter Icon */}
                      <div className="lg:hidden">
                        <button
                          onClick={() => setShowFilters(true)}
                          className="p-3 rounded-lg shadow-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          style={{ color: "#5A0117" }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-6">
                      {sortedProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                        No products found
                      </h3>
                      <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                        Try adjusting your search or filter criteria to find what you are looking for
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory("")
                          setSearchTerm("")
                          setPriceRange({ min: 0, max: 10000 })
                          setSortBy("name")
                          setInStock(false)
                        }}
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
