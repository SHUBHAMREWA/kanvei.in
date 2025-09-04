"use client"
import { useEffect } from "react"
import Link from "next/link"
import { useAuth } from "../../contexts/AuthContext"

export default function NavbarDrawer({ isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose()
  }

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#5A0117" }}
      >
        <div className="flex flex-col h-full text-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
            <Link
              href="/"
              className="text-xl font-bold hover:opacity-80 transition-opacity"
              style={{ fontFamily: "Sugar, serif" }}
              onClick={onClose}
            >
              🏠 Home
            </Link>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-6">
              <div className="space-y-6">
                {/* Main Navigation */}
                <div>
                  <h3
                    className="text-sm font-semibold mb-3 opacity-70"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    CATEGORIES
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/products"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Shop
                    </Link>
                    <Link
                      href="/categories/jewellery"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Jewellery
                    </Link>
                    <Link
                      href="/categories/stationery"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Stationery
                    </Link>
                    <Link
                      href="/categories/cosmetics"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Cosmetics
                    </Link>
                    <Link
                      href="/categories/electronics"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Electronics
                    </Link>
                  </div>
                </div>

                {/* Clothing Section */}
                <div>
                  <h3
                    className="text-sm font-semibold mb-3 opacity-70"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    CLOTHING
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/categories/clothing/mens-wear"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Mens Wear
                    </Link>
                    <Link
                      href="/categories/clothing/womens-wear"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Womens Wear
                    </Link>
                    <Link
                      href="/categories/clothing/kids-wear"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Kids Wear
                    </Link>
                  </div>
                </div>

                {/* Other Links */}
                <div>
                  <Link
                    href="/contact"
                    className="block py-2 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    onClick={onClose}
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          {/* User Section */}
          <div className="border-t border-white border-opacity-20 p-6">
            {isAuthenticated ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-white border-opacity-20">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: "#8C6141" }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {user?.name}
                    </p>
                    <p className="text-sm opacity-70" style={{ fontFamily: "Montserrat, sans-serif" }}>
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* User Menu */}
                <div className="space-y-3">
                  {user?.role === "admin" && (
                    <Link
                      href="/admindashboard"
                      className="block py-2 hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                      onClick={onClose}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="block py-2 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    onClick={onClose}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block py-2 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    onClick={onClose}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block py-2 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                    onClick={onClose}
                  >
                    My Wishlist
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center py-3 px-4 rounded-lg border border-white border-opacity-30 hover:bg-white hover:bg-opacity-10 transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                  onClick={onClose}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center py-3 px-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                  style={{ backgroundColor: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
                  onClick={onClose}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
