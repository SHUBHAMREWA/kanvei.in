import Image from "next/image"
import Link from "next/link"
import Header from "@/components/shared/Header"
import Footer from "@/components/shared/Footer"
import { FaHeart, FaStar, FaShippingFast, FaAward, FaUsers, FaGlobe, FaHandshake, FaLeaf } from "react-icons/fa"

export const metadata = {
  title: "About Us - KANVEI",
  description: "Learn about KANVEI's journey, values, and commitment to delivering premium quality products across stationery, jewelry, fashion, cosmetics, and electronics.",
  keywords: "KANVEI about, company story, premium products, quality craftsmanship, customer satisfaction",
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-4" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "Sugar, serif" }}>
              About Kanvei
            </h1>
            <p className="text-xl text-white opacity-90 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Crafting Excellence, Curating Dreams - Where Premium Quality Meets Passionate Service
            </p>
          </div>
        </section>

        {/* Main Story Section */}
        <section className="py-16 px-4" style={{ backgroundColor: "#DBCCB7" }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Our Story
                </h2>
                <div className="space-y-6 text-gray-700" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  <p className="text-lg leading-relaxed">
                    Founded with a vision to bring together the finest collection of premium products, Kanvei has emerged as a trusted destination for discerning customers who value quality, style, and authenticity.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Our journey began with a simple belief: that every product should tell a story of craftsmanship, innovation, and care. From elegant stationery that inspires creativity to exquisite jewelry that celebrates life's special moments, we curate only the best.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Today, Kanvei stands as a testament to our commitment to excellence, serving customers across diverse categories with the same passion and dedication that started our journey.
                  </p>
                </div>
              </div>
              
              {/* Image */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="relative h-80 rounded-lg overflow-hidden">
                    <Image
                      src="/lastimg.webp"
                      alt="Kanvei Story"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                Our Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
                The principles that guide everything we do and shape our commitment to you
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {/* Value 1 */}
              <div className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
                     style={{ backgroundColor: "#DBCCB7" }}>
                  <FaAward className="text-2xl sm:text-3xl" style={{ color: "#5A0117" }} />
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Premium Quality
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  We source only the finest products that meet our rigorous standards of excellence and craftsmanship.
                </p>
              </div>

              {/* Value 2 */}
              <div className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
                     style={{ backgroundColor: "#DBCCB7" }}>
                  <FaHeart className="text-2xl sm:text-3xl" style={{ color: "#5A0117" }} />
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Customer First
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Your satisfaction drives every decision we make, from product selection to customer service.
                </p>
              </div>

              {/* Value 3 */}
              <div className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
                     style={{ backgroundColor: "#DBCCB7" }}>
                  <FaHandshake className="text-2xl sm:text-3xl" style={{ color: "#5A0117" }} />
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Trust & Integrity
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  We build lasting relationships through transparency, honesty, and reliable service.
                </p>
              </div>

              {/* Value 4 */}
              <div className="text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" 
                     style={{ backgroundColor: "#DBCCB7" }}>
                  <FaLeaf className="text-2xl sm:text-3xl" style={{ color: "#5A0117" }} />
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Sustainability
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  We care about our planet and choose products and practices that respect the environment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founders Section */}
        <section className="py-16 px-4" style={{ backgroundColor: "#DBCCB7" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                Meet Our Founders
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
                The visionary minds behind Kanvei's commitment to excellence and innovation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {/* Founder 1 - Adiya */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/founder.png"
                      alt="Adiya - Co-Founder"
                      fill
                      className="object-cover"
                      style={{ borderRadius: "50%" }}
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Adiya
                </h3>
                <p className="text-lg font-semibold mb-4" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                  Co-Founder & CEO
                </p>
                <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  With a passion for premium quality and customer satisfaction, Adiya leads Kanvei's vision to curate the finest products. Her expertise in business strategy and commitment to excellence drives the company's growth and innovation.
                </p>
              </div>

              {/* Founder 2 - Raj */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="/founder.png"
                      alt="Raj - Co-Founder"
                      fill
                      className="object-cover" 
                      style={{ borderRadius: "50%" }}
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Raj
                </h3>
                <p className="text-lg font-semibold mb-4" style={{ color: "#8C6141", fontFamily: "Montserrat, sans-serif" }}>
                  Co-Founder & CTO
                </p>
                <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  A technology enthusiast and innovation driver, Raj brings technical excellence to Kanvei's operations. His focus on seamless user experience and cutting-edge solutions ensures our platform delivers exceptional service to every customer.
                </p>
              </div>
            </div>

            {/* Mission Statement */}
            <div className="mt-16 text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold mb-4" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Our Mission
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  "To create a platform where quality meets passion, where every product tells a story of excellence, and where customer satisfaction is not just a goal but a promise. Together, we're building more than a business – we're crafting experiences that last a lifetime."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  10K+
                </div>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Happy Customers
                </p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  500+
                </div>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Premium Products
                </p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  50+
                </div>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Cities Served
                </p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  99%
                </div>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Satisfaction Rate
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 px-4" style={{ backgroundColor: "#DBCCB7" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                Why Choose Kanvei?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <FaStar className="text-4xl mx-auto mb-4" style={{ color: "#5A0117" }} />
                <h3 className="text-xl font-bold mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Curated Excellence
                </h3>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Every product is handpicked for its quality, design, and value, ensuring you get only the best.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <FaShippingFast className="text-4xl mx-auto mb-4" style={{ color: "#5A0117" }} />
                <h3 className="text-xl font-bold mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Fast & Secure Delivery
                </h3>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Swift, secure shipping with careful packaging to ensure your products arrive in perfect condition.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <FaUsers className="text-4xl mx-auto mb-4" style={{ color: "#5A0117" }} />
                <h3 className="text-xl font-bold mb-3" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                  Exceptional Support
                </h3>
                <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Our dedicated team is always ready to assist you with personalized service and expert guidance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4" style={{ backgroundColor: "#5A0117" }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "Sugar, serif" }}>
              Ready to Experience the Kanvei Difference?
            </h2>
            <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Join thousands of satisfied customers who have made Kanvei their trusted choice for premium products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-block px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-300"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Explore Products
              </Link>
              <Link
                href="/contact"
                className="inline-block px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-colors duration-300"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
