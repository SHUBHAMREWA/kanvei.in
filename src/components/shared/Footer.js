"use client"
import Link from "next/link"
import { useAuth } from "../../contexts/AuthContext"

export default function Footer() {
  const { isAuthenticated } = useAuth()

  return (
    <footer style={{ backgroundColor: "#5A0117" }} className="text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              Kanvei
            </h2>
            <p className="mb-4" style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>
              Discover premium quality products with exceptional craftsmanship. Your trusted partner for elegant and
              sophisticated shopping experience.
            </p>
            <div className="space-y-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>
              <p>Email: kanvei.in@gmail.com</p>
              <p>Phone: +91 7488425690</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              Quick Links
            </h3>
            <div className="space-y-2">
              <Link
                href="/products"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                All Products
              </Link>
              <Link
                href="/categories"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                Categories
              </Link>
              <Link
                href="/about"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                Contact
              </Link>
              <Link
                href="/blog"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "Sugar, serif" }}>
              Customer Service
            </h3>
            <div className="space-y-2">
              <Link
                href="/shipping"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                Shipping Info
              </Link>
              <Link
                href="/returns"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                Returns
              </Link>
              <Link
                href="/faq"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                FAQ
              </Link>
              <Link
                href="/support"
                className="block hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
              >
                Support
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/adminlogin"
                  className="block hover:opacity-80 transition-opacity"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white border-opacity-20 mt-8 pt-8 text-center">
          <p style={{ fontFamily: "Montserrat, sans-serif", color: "#DBCCB7" }}>© 2024 Kanvei. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
