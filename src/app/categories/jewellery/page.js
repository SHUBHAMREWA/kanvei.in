"use client"
import { useState, useEffect } from "react"
import Header from "../../../components/shared/Header"
import Footer from "../../../components/shared/Footer"
import ProductCard from "../../../components/ProductCard"

export default function JewelleryPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJewelleryProducts()
  }, [])

  const fetchJewelleryProducts = async () => {
    try {
      const response = await fetch("/api/products?category=Jewellery")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProducts(data.products)
        }
      }
    } catch (error) {
      console.error("Error fetching jewellery products:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="py-20 text-center text-white" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ fontFamily: "Sugar, serif" }}>
              Jewellery Collection
            </h1>
            <p className="text-xl md:text-2xl opacity-90" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Discover our exquisite collection of handcrafted jewellery pieces
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2"
                  style={{ borderColor: "#5A0117" }}
                ></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  No Jewellery Products Found
                </h3>
                <p className="text-lg" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                  Check back soon for our latest jewellery collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
