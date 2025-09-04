"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import NavbarDrawer from "./NavbarDrawer"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import DashboardIcon from "@mui/icons-material/Dashboard"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isClothingDropdownOpen, setIsClothingDropdownOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef(null)
  const { getCartItemsCount, isLoggedIn } = useCart()
  const { showNotification } = useNotification()
  const { data: session, status } = useSession()
  const { user: authUser, isAuthenticated: customAuth, logout: customLogout } = useAuth()
  const router = useRouter()

  // Determine which user is active
  const currentUser = session?.user || authUser
  const isUserAuthenticated = isLoggedIn || (status === "authenticated") || customAuth

  // Handle search functionality
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      // Focus on search input after it appears
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // Clear search when closing
      setSearchTerm("")
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Navigate to products page with search query
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setIsSearchOpen(false)
      setSearchTerm("")
    }
  }

  // Close search when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSearchOpen && !event.target.closest('.search-container')) {
        setIsSearchOpen(false)
        setSearchTerm("")
      }
    }

    const handleScroll = () => {
      if (isSearchOpen) {
        setIsSearchOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('click', handleClickOutside)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isSearchOpen])

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    
    // Handle NextAuth logout
    if (status === "authenticated") {
      await signOut({ callbackUrl: '/' })
    }
    
    // Handle custom auth logout  
    if (customAuth) {
      await customLogout()
    }
  }

  return (
    <>
      <header style={{ backgroundColor: "#5A0117" }} className="text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Always visible */}
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: "Sugar, serif" }}>
                Kanvei
              </h1>
            </Link>

            {/* Search Bar (when open) - Center positioned for desktop, full width for mobile */}
            {isSearchOpen && (
              <div className="search-container flex flex-1 justify-center mx-2 md:mx-8">
                <form onSubmit={handleSearchSubmit} className="w-full max-w-lg">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="w-full px-4 md:px-5 py-2 md:py-3 pr-12 md:pr-14 text-black placeholder-gray-500 rounded-xl border-2 border-white border-opacity-30 bg-white bg-opacity-90 focus:outline-none focus:border-white focus:bg-opacity-100 transition-all backdrop-blur-sm shadow-lg"
                      style={{ 
                        fontFamily: "Montserrat, sans-serif",
                        color: "black",
                        fontSize: "16px"
                      }}
                    />
                    <button
                      type="submit"
                      className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 p-1.5 md:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ 
                        color: "#5A0117", 
                        backgroundColor: "transparent"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#5A0117"
                        e.target.style.color = "white"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "transparent"
                        e.target.style.color = "#5A0117"
                      }}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex items-center space-x-8 transition-all duration-300 ${isSearchOpen ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
              <Link
                href="/"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Shop
              </Link>
              <Link
                href="/categories/jewellery"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Jewellery
              </Link>
              <Link
                href="/categories/stationery"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Stationery
              </Link>
              <Link
                href="/categories/cosmetics"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Cosmetics
              </Link>
              <div 
               onMouseEnter={()=>  setIsClothingDropdownOpen(true)} 
               className="relative">
                <button
                  onClick={() => setIsClothingDropdownOpen(!isClothingDropdownOpen)}
                  className="hover:opacity-80 transition-opacity flex items-center gap-1"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Clothing
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isClothingDropdownOpen && (
                  <div 
                  onMouseLeave={()=>setIsClothingDropdownOpen(false)}
                   className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/categories/clothing"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      onClick={() => setIsClothingDropdownOpen(false)}
                    >
                      All Clothing
                    </Link>
                    <Link
                      href="/categories/clothing/mens-wear"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      onClick={() => setIsClothingDropdownOpen(false)}
                    >
                      Mens Wear
                    </Link>
                    <Link
                      href="/categories/clothing/womens-wear"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      onClick={() => setIsClothingDropdownOpen(false)}
                    >
                      Womens Wear
                    </Link>
                    <Link
                      href="/categories/clothing/kids-wear"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      onClick={() => setIsClothingDropdownOpen(false)}
                    >
                      Kids Wear
                    </Link>
                  </div>
                )}
              </div>
              <Link
                href="/categories/electronics"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Electronics
              </Link>
              <Link
                href="/contact"
                className="hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Contact
              </Link>
            </nav>

            {/* Cart and User Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Icon - Hide when search is open */}
              {!isSearchOpen && (
                <button
                  onClick={handleSearchToggle}
                  className="hover:opacity-80 transition-opacity p-1"
                  title="Search products"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              )}

              {isUserAuthenticated && currentUser?.role !== "admin" && (
                <Link href="/wishlist" className={`hover:opacity-80 transition-opacity ${isSearchOpen ? 'hidden md:block' : 'block'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </Link>
              )}

              {/* Cart/Dashboard Icon */}
              {currentUser?.role === "admin" ? (
                <Link href="/admindashboard" className={`hover:opacity-80 transition-opacity relative ${isSearchOpen ? 'hidden md:block' : 'block'}`}>
                  <DashboardIcon sx={{ fontSize: 24 }} />
                </Link>
              ) : (
                <div className={`relative ${isSearchOpen ? 'hidden md:block' : 'block'}`}>
                  {isLoggedIn ? (
                    <Link href="/cart" className="hover:opacity-80 transition-opacity relative">
                      <ShoppingCartIcon sx={{ fontSize: 24 }} />
                      {getCartItemsCount() > 0 && (
                        <span
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white"
                          style={{ backgroundColor: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                        >
                          {getCartItemsCount()}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => showNotification('Please login to access cart', 'error')}
                      className="hover:opacity-80 transition-opacity relative opacity-50 cursor-not-allowed"
                    >
                      <ShoppingCartIcon sx={{ fontSize: 24 }} />
                    </button>
                  )}
                </div>
              )}

              {isUserAuthenticated ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#8C6141" }}
                    >
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {/* <span className="hidden sm:block">{user?.name}</span> */}
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                        >
                          {currentUser?.name || 'User'}
                        </p>
                        <p className="text-xs" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                          {currentUser?.email || ''}
                        </p>
                      </div>

                      {currentUser?.role === "admin" && (
                        <Link
                          href="/admindashboard"
                          className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Profile
                      </Link>

                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/cart"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Cart
                      </Link>

                      <Link
                        href="/wishlist"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Wishlist
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hover:opacity-80 transition-opacity hidden md:block"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Login
                </Link>
              )}

              <button onClick={() => setIsDrawerOpen(true)} className={`md:hidden p-2 ${isSearchOpen ? 'hidden' : 'block'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <NavbarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  )
}
