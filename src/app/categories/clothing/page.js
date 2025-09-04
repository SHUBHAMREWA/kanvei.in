"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Header from "../../../components/shared/Header"
import Footer from "../../../components/shared/Footer"
import ProductCard from "../../../components/ProductCard"

export default function ClothingCategoryPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?category=Clothing")
        const data = await response.json()
        if (data.success) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Fashion & Clothing
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Discover our premium collection of clothing and fashion accessories
            </p>
          </div>

          {/* Clothing Subcategories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Shop by Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link
                href="/categories/clothing/mens-wear"
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Men's Wear
                </h3>
                <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Stylish clothing for men
                </p>
              </Link>
              
              <Link
                href="/categories/clothing/womens-wear"
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Women's Wear
                </h3>
                <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Elegant fashion for women
                </p>
              </Link>
              
              <Link
                href="/categories/clothing/kids-wear"
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  Kids Wear
                </h3>
                <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Comfortable clothes for children
                </p>
              </Link>
            </div>
          </div>

          {/* Products Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              All Clothing Products
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
            
            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  No clothing products found.
                </p>
                <Link
                  href="/products"
                  className="inline-block mt-4 px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
