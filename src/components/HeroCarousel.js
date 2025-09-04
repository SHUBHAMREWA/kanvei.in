"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      id: "clothing",
      image: "/cloth2.webp",
      link: "/categories/clothing",
      bgColor: "bg-gradient-to-r from-[#5A0117] to-[#8C6141]",
      title: "Fashion & Clothing",
      description: "Discover latest trends"
    },
    {
      id: "stationery", 
      image: "/sationary.jpg",
      link: "/categories/stationery",
      bgColor: "bg-gradient-to-r from-[#DBCCB7] to-[#8C6141]",
      title: "Premium Stationery",
      description: "Quality writing essentials"
    },
    {
      id: "jewellery",
      image: "/jewelery.webp",
      link: "/categories/jewellery", 
      bgColor: "bg-gradient-to-r from-[#AFABAA] to-[#5A0117]",
      title: "Elegant Jewellery",
      description: "Timeless pieces"
    },
    {
      id: "cosmetics",
      image: "/cosmetic.webp",
      link: "/categories/cosmetics",
      bgColor: "bg-gradient-to-r from-[#8C6141] to-[#5A0117]",
      title: "Beauty & Cosmetics",
      description: "Enhance your beauty"
    },
  ]

  // Handle slide click navigation
  const handleSlideClick = (slide, index) => {
    console.log(`Navigating to: ${slide.title} -> ${slide.link}`);
    router.push(slide.link);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="relative w-full h-[190px] sm:h-[280px] md:h-[320px] lg:h-[360px] overflow-hidden">
      <div className="relative h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={`slide-${slide.id}-${index}`}
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
            >
              <div 
                className="block w-full h-full cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleSlideClick(slide, index);
                }}
              >

                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }}>
                  <div className={`absolute inset-0 ${slide.bgColor} opacity-30`}> 
                    
                  </div>
                  {/* Debug overlay - shows which slide is active */}
                  {/* <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded z-20">
                    Slide {index + 1}: {slide.title} → {slide.link}
                  </div> */}
                  {/* Active indicator */}
                  {/* {isActive && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs rounded z-20">
                      ACTIVE
                    </div>
                  )} */}
                </div> 
                
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-[#DBCCB7] bg-opacity-80 rounded-full flex items-center justify-center text-[#5A0117] hover:bg-opacity-100 transition-all duration-200 z-20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-[#DBCCB7] bg-opacity-80 rounded-full flex items-center justify-center text-[#5A0117] hover:bg-opacity-100 transition-all duration-200 z-20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide ? "bg-[#DBCCB7] scale-125" : "bg-[#DBCCB7] bg-opacity-50 hover:bg-opacity-75"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
