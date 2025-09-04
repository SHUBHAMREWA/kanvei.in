"use client"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { FiTruck, FiClock, FiMapPin, FiPackage, FiShield, FiCheckCircle } from "react-icons/fi"

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Shipping Information
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Fast, reliable delivery to your doorstep. Learn about our shipping options, timelines, and policies.
            </p>
          </div>

          {/* Shipping Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Standard Delivery */}
            <div className="bg-white border-2 rounded-lg p-6 text-center hover:shadow-lg transition-shadow" style={{ borderColor: "#5A0117" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FFF5F5", color: "#5A0117" }}>
                <FiTruck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#5A0117" }}>Standard Delivery</h3>
              <p className="text-gray-600 mb-4">5-7 business days</p>
              <p className="text-2xl font-bold" style={{ color: "#5A0117" }}>₹49</p>
              <p className="text-sm text-gray-500 mt-2">Free on orders above ₹999</p>
            </div>

            {/* Express Delivery */}
            <div className="bg-white border-2 rounded-lg p-6 text-center hover:shadow-lg transition-shadow" style={{ borderColor: "#8C6141" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FFF8F0", color: "#8C6141" }}>
                <FiClock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#5A0117" }}>Express Delivery</h3>
              <p className="text-gray-600 mb-4">2-3 business days</p>
              <p className="text-2xl font-bold" style={{ color: "#5A0117" }}>₹99</p>
              <p className="text-sm text-gray-500 mt-2">Free on orders above ₹1999</p>
            </div>

            {/* Same Day Delivery */}
            <div className="bg-white border-2 rounded-lg p-6 text-center hover:shadow-lg transition-shadow" style={{ borderColor: "#5A0117" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FFF5F5", color: "#5A0117" }}>
                <FiPackage className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#5A0117" }}>Same Day Delivery</h3>
              <p className="text-gray-600 mb-4">Within 24 hours</p>
              <p className="text-2xl font-bold" style={{ color: "#5A0117" }}>₹199</p>
              <p className="text-sm text-gray-500 mt-2">Available in select cities</p>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gray-50 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: "#5A0117" }}>
              Delivery Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#5A0117" }}>
                  <FiMapPin className="w-5 h-5" />
                  Delivery Areas
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    All major cities in India
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    Rural areas (additional 1-2 days)
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    Pin code verification at checkout
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    Same day delivery in Mumbai, Delhi, Bangalore
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#5A0117" }}>
                  <FiShield className="w-5 h-5" />
                  Shipping Features
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    Real-time order tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    Secure packaging
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    SMS & email notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    Contact-free delivery available
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Shipping Policy */}
          <div className="bg-white border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#5A0117" }}>
              Shipping Policy
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                  Order Processing Time
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Orders are processed within 1-2 business days. Orders placed after 2 PM on Friday will be processed on the following Monday. 
                  During sale periods and festivals, processing may take an additional 1-2 days.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                  Delivery Timelines
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg">
                    <thead>
                      <tr style={{ backgroundColor: "#FFF5F5" }}>
                        <th className="border border-gray-200 px-4 py-3 text-left" style={{ color: "#5A0117" }}>Location</th>
                        <th className="border border-gray-200 px-4 py-3 text-left" style={{ color: "#5A0117" }}>Standard</th>
                        <th className="border border-gray-200 px-4 py-3 text-left" style={{ color: "#5A0117" }}>Express</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3">Metro Cities</td>
                        <td className="border border-gray-200 px-4 py-3">3-5 days</td>
                        <td className="border border-gray-200 px-4 py-3">1-2 days</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3">Tier 2 Cities</td>
                        <td className="border border-gray-200 px-4 py-3">5-7 days</td>
                        <td className="border border-gray-200 px-4 py-3">2-3 days</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3">Rural Areas</td>
                        <td className="border border-gray-200 px-4 py-3">7-10 days</td>
                        <td className="border border-gray-200 px-4 py-3">4-5 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                  Shipping Charges
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Standard shipping: ₹49 (Free on orders above ₹999)</li>
                  <li>• Express shipping: ₹99 (Free on orders above ₹1999)</li>
                  <li>• Same day delivery: ₹199 (Available in select metro cities)</li>
                  <li>• COD charges: ₹25 additional for Cash on Delivery orders</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                  Order Tracking
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Once your order is shipped, you will receive a tracking number via SMS and email. 
                  You can track your order status in real-time through our website or mobile app.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: "#5A0117" }}>
                  Important Notes
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Delivery timelines are estimates and may vary due to external factors</li>
                  <li>• We do not ship on Sundays and national holidays</li>
                  <li>• For remote locations, additional delivery charges may apply</li>
                  <li>• Large items may require special delivery arrangements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
