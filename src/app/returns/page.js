"use client"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { FiRefreshCcw, FiTruck, FiCreditCard, FiAlertTriangle, FiShield, FiCheckCircle } from "react-icons/fi"

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Returns & Refunds
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Not satisfied with your purchase? No problem. Our hassle-free return policy makes it easy.
            </p>
          </div>

          {/* Return Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border rounded-lg p-6 text-center">
              <FiRefreshCcw className="w-8 h-8 mx-auto mb-3" style={{ color: "#5A0117" }} />
              <h3 className="font-semibold" style={{ color: "#5A0117" }}>7-Day Easy Returns</h3>
              <p className="text-gray-600 text-sm mt-2">Return within 7 days of delivery</p>
            </div>
            <div className="bg-white border rounded-lg p-6 text-center">
              <FiCreditCard className="w-8 h-8 mx-auto mb-3" style={{ color: "#5A0117" }} />
              <h3 className="font-semibold" style={{ color: "#5A0117" }}>Quick Refunds</h3>
              <p className="text-gray-600 text-sm mt-2">Refunds processed within 3-5 days</p>
            </div>
            <div className="bg-white border rounded-lg p-6 text-center">
              <FiTruck className="w-8 h-8 mx-auto mb-3" style={{ color: "#5A0117" }} />
              <h3 className="font-semibold" style={{ color: "#5A0117" }}>Free Pickup</h3>
              <p className="text-gray-600 text-sm mt-2">Pickup arranged for eligible locations</p>
            </div>
          </div>

          {/* How to return */}
          <div className="bg-gray-50 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#5A0117" }}>How to initiate a return</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-700">
              <li>Go to My Orders and select the item you want to return</li>
              <li>Choose a reason for return and select refund or replacement</li>
              <li>Our courier partner will schedule a pickup</li>
              <li>Keep the product in original packaging with all tags</li>
              <li>Refund will be processed after quality check</li>
            </ol>
          </div>

          {/* Policy */}
          <div className="bg-white border rounded-lg p-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#5A0117" }}>Eligibility</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2"><FiCheckCircle className="mt-1" style={{ color: '#16a34a' }} /> Items must be unused, undamaged and in original packaging</li>
                <li className="flex items-start gap-2"><FiCheckCircle className="mt-1" style={{ color: '#16a34a' }} /> All tags, warranty cards and accessories included</li>
                <li className="flex items-start gap-2"><FiCheckCircle className="mt-1" style={{ color: '#16a34a' }} /> Return requested within 7 days of delivery</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#5A0117" }}>Non-returnable items</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Personal care products (opened)</li>
                <li>Innerwear, swimwear and certain apparel (for hygiene reasons)</li>
                <li>Perishable or customized items</li>
                <li>Gift cards</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#5A0117" }}>Refunds</h3>
              <p className="text-gray-700">Refunds are processed to original payment method within 3-5 business days after the returned item passes quality check. For COD orders, refund will be issued to your bank account or as store credit.</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 mt-0.5 text-yellow-600" />
              <p className="text-sm text-yellow-900">If you receive a damaged or wrong product, please initiate a return within 48 hours of delivery for priority support.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

