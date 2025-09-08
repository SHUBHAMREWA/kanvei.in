"use client"
import { useState, useEffect } from "react"
import Header from "../components/shared/Header"
import Footer from "../components/shared/Footer"
import HeroCarousel from "../components/HeroCarousel"
import HomeProductShow from "../components/HomeProductShow"
import Link from "next/link"
import { FaTshirt, FaGem, FaPen, FaGift, FaMobile, FaPalette, FaTh } from "react-icons/fa"


export default function HomePage() {  

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Static categories with icons
  const categoriesStatic = [
    { _id: "1", name: "Clothing", icon: FaTshirt, href: "/categories/clothing" }, 
    { _id: "2", name: "Jewellery", icon: FaGem, href: "/categories/jewellery" }, 
    { _id: "3", name: "Stationery", icon: FaPen, href: "/categories/stationery" }, 
    { _id: "4", name: "Electronics", icon: FaMobile, href: "/categories/electronics" },
    { _id: "5", name: "Cosmetics", icon: FaPalette, href: "/categories/cosmetics" },
    { _id: "6", name: "Gifts", icon: FaGift, href: "/categories/gifts" }
  ]


  

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch("/api/categories")
        const categoriesData = await categoriesRes.json()
        if (categoriesData.success) {
          setCategories(categoriesData.categories.slice(0, 6))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Carousel Section */}
        <section className="relative">
          <HeroCarousel />
        </section>

        {/* Categories Section - Full Width */}
        <section className="w-full px-4 py-6 sm:py-8" style={{ backgroundColor: "#DBCCB7" }}>
          <div className="max-w-7xl mx-auto">
       
            
            {/* Mobile Layout - Single Row */}
            <div className="block sm:hidden">
              <div className="grid grid-cols-4 gap-2">
                {/* First 3 Categories - Skip Electronics */}
                {categoriesStatic.slice(0, 3).map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Link
                      key={category._id}
                      href={category.href}
                      className="flex flex-col items-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group"
                    >
                      <div 
                        className="p-2 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white border-opacity-40 shadow-lg"
                        style={{ 
                          background: "rgba(255, 255, 255, 0.6)",
                          boxShadow: "0 8px 32px rgba(90, 1, 23, 0.2)"
                        }}
                      >
                        <IconComponent 
                          className="text-sm" 
                          style={{ color: "#5A0117" }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold text-center group-hover:text-opacity-80 transition-colors px-1"
                        style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                      >
                        {category.name}
                      </span>
                    </Link>
                  )
                })}
                
                {/* View All Categories Icon - Mobile */}
                <Link
                  href="/categories"
                  className="flex flex-col items-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group"
                >
                  <div 
                    className="p-2 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white border-opacity-40 shadow-lg"
                    style={{ 
                      background: "rgba(255, 255, 255, 0.6)",
                      boxShadow: "0 8px 32px rgba(90, 1, 23, 0.2)"
                    }}
                  >
                    <FaTh 
                      className="text-sm" 
                      style={{ color: "#5A0117" }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold text-center group-hover:text-opacity-80 transition-colors px-1"
                    style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                  >
                    View All
                  </span>
                </Link>
              </div>
            </div>
            
            {/* Desktop Layout - Original */}
            <div className="hidden sm:grid sm:grid-cols-7 gap-4 md:gap-6">
              {categoriesStatic.map((category) => {
                const IconComponent = category.icon
                return (
                  <Link
                    key={category._id}
                    href={category.href}
                    className="flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 group"
                  >
                    <div 
                      className="p-3 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white border-opacity-40 shadow-lg"
                      style={{ 
                        background: "rgba(255, 255, 255, 0.6)",
                        boxShadow: "0 8px 32px rgba(90, 1, 23, 0.2)"
                      }}
                    >
                      <IconComponent 
                        className="text-xl md:text-2xl" 
                        style={{ color: "#5A0117" }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold text-center group-hover:text-opacity-80 transition-colors"
                      style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                    >
                      {category.name}
                    </span>
                  </Link>
                )
              })}
              
              {/* View All Categories Icon - Desktop */}
              <Link
                href="/categories"
                className="flex flex-col items-center p-4 rounded-xl transition-all duration-300 hover:scale-105 group"
              >
                <div 
                  className="p-3 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-white border-opacity-40 shadow-lg"
                  style={{ 
                    background: "rgba(255, 255, 255, 0.6)",
                    boxShadow: "0 8px 32px rgba(90, 1, 23, 0.2)"
                  }}
                >
                  <FaTh 
                    className="text-xl md:text-2xl" 
                    style={{ color: "#5A0117" }}
                  />
                </div>
                <span
                  className="text-sm font-semibold text-center group-hover:text-opacity-80 transition-colors"
                  style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
                >
                  View All Category
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Grid Section - Full Screen Width */}
        <section className="w-full ">
          {/* First Row - Diwali Sale */}
          <div className="w-full mb-6">
            <Link
              href="/products?sale=diwali"
              className="group block relative overflow-hidden transition-all duration-300 hover:shadow-xl"
              style={{ 
                backgroundColor: "#5A0117",
                minHeight: "200px"
              }}
            >
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)" }}></div>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-8 left-20 text-8xl transform -rotate-12">🪔</div>
                <div className="absolute top-12 right-32 text-6xl transform rotate-12">✨</div>
                <div className="absolute bottom-8 left-40 text-7xl transform rotate-45">🎆</div>
                <div className="absolute bottom-12 right-20 text-5xl transform -rotate-45">🎊</div>
                <div className="absolute top-20 left-1/2 text-6xl transform -translate-x-1/2 rotate-6">🎇</div>
              </div>
              
              <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center text-white">
                  <div className="mb-6">
                    <span className="text-7xl">🪔</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: "Sugar, serif" }}>
                    Diwali Sale
                  </h2>
                  <p className="text-2xl md:text-3xl mb-8 opacity-95" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Up to <span className="font-bold" style={{ color: "#DBCCB7" }}>50% OFF</span> on Festival Collection
                  </p>
                  <div className="inline-flex items-center px-12 py-4 rounded-full border-3 border-white border-opacity-50 hover:bg-white hover:bg-opacity-10 transition-all duration-300"
                    style={{ backgroundColor: "rgba(219, 204, 183, 0.2)" }}
                  >
                    <span className="text-xl font-bold mr-3" style={{ fontFamily: "Sugar, serif" }}>Shop Now</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

        </section>

        {/* Products Section */}
        <HomeProductShow />

        {/* About Section */}
        <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                About Kanvei
              </h2>
              <p className="text-lg mb-6" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                At Kanvei, we curate an exceptional collection spanning Stationery, Jewellery, Fashion, Cosmetics, and
                Electronics. Our carefully selected products represent the finest in quality, style, and craftsmanship
                across diverse categories.
              </p>
              <p className="text-lg mb-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                From premium writing instruments to elegant jewelry, from sophisticated fashion to cutting-edge
                electronics, every item in our collection is chosen with meticulous attention to detail and quality.
              </p>
              <Link
                href="/about"
                className="inline-block px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                Learn More
              </Link>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src="lastimg.webp"
                alt="KANVEI Product Collection"
                className="w-full h-full object-cover"
                height={400} 
                width={600}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
