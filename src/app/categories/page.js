"use client"
import { useState, useEffect } from "react"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import CategoryCard from "../../components/CategoryCard"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories?withHierarchy=true")
        const data = await res.json()
        console.log("Fetched categories:", data)
        if (data.success) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category._id} category={category} />
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                  No categories found
                </h3>
                <p className="text-lg" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  Categories will appear here once they are added
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
