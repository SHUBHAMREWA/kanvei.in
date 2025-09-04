import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import Link from "next/link"

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#5A0117" }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Order Confirmed!
            </h1>
            <p className="text-lg mb-8" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Thank you for your order. We will send you a confirmation email shortly with your order details and tracking
              information.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/products"
              className="block w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
              Continue Shopping
            </Link>
            <Link
              href="/orders"
              className="block w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
            >
               Check Orders
            </Link>
            <Link
              href="/"
              className="block w-full py-3 border-2 font-semibold rounded-lg hover:opacity-80 transition-opacity"
              style={{
                borderColor: "#8C6141",
                color: "#8C6141",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
