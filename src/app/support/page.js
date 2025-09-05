"use client"
import { useState } from "react"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { useToast } from "../../contexts/ToastContext"
import { FiMail, FiPhone, FiMessageSquare, FiClock, FiMapPin, FiHeadphones, FiSend, FiCheckCircle } from "react-icons/fi"

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSuccess, showError } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        showSuccess(data.message || "Your message has been sent successfully! We'll get back to you soon.", 5000)
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          category: "general"
        })
      } else {
        const errorMessage = data.error || "Failed to send message. Please try again or contact us directly."
        showError(errorMessage, 4000)
      }
    } catch (error) {
      console.error('Support form error:', error)
      showError("Network error. Please check your connection and try again.", 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Customer Support
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Need help? We are here to assist you. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-white border rounded-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-6" style={{ color: "#5A0117" }}>
                  Get in Touch
                </h2>

                {/* Contact Methods */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF5F5", color: "#5A0117" }}>
                      <FiMail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#5A0117" }}>Email Support</h3>
                      <p className="text-gray-600 text-sm mb-2">For general inquiries and support</p>
                      <a href="mailto:support@kanvei.in" className="text-sm hover:underline" style={{ color: "#5A0117" }}>
                        support@kanvei.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF8F0", color: "#8C6141" }}>
                      <FiPhone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#5A0117" }}>Phone Support</h3>
                      <p className="text-gray-600 text-sm mb-2">Speak with our support team</p>
                      <a href="tel:+91-1234567890" className="text-sm hover:underline" style={{ color: "#5A0117" }}>
                        +91-1234-567-890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF5F5", color: "#5A0117" }}>
                      <FiMessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#5A0117" }}>Live Chat</h3>
                      <p className="text-gray-600 text-sm mb-2">Chat with us in real-time</p>
                      <button className="text-sm hover:underline" style={{ color: "#5A0117" }}>
                        Start Chat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#5A0117" }}>
                    <FiClock className="w-5 h-5" />
                    Business Hours
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>

                {/* Office Address */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#5A0117" }}>
                    <FiMapPin className="w-5 h-5" />
                    Office Address
                  </h3>
                  <address className="text-sm text-gray-600 not-italic">
                    Kanvei E-commerce<br />
                    123 Business District<br />
                    Mumbai, Maharashtra 400001<br />
                    India
                  </address>
                </div>
              </div>
            </div>

            {/* Support Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FiHeadphones className="w-6 h-6" style={{ color: "#5A0117" }} />
                  <h2 className="text-2xl font-semibold" style={{ color: "#5A0117" }}>
                    Send us a Message
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-colors"
                        style={{ focusRingColor: "#5A0117" }}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-colors"
                        style={{ focusRingColor: "#5A0117" }}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-colors"
                      style={{ focusRingColor: "#5A0117" }}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Support</option>
                      <option value="product">Product Information</option>
                      <option value="shipping">Shipping & Delivery</option>
                      <option value="return">Returns & Refunds</option>
                      <option value="technical">Technical Issues</option>
                      <option value="billing">Billing & Payment</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-colors"
                      style={{ focusRingColor: "#5A0117" }}
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-colors resize-none"
                      style={{ focusRingColor: "#5A0117" }}
                      placeholder="Describe your inquiry in detail. Include order number if applicable."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#5A0117" }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> For faster resolution, please include your order number (if applicable) and be as specific as possible about your inquiry.
                  </p>
                </div>
              </div>

              {/* Quick Help */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: "#5A0117" }}>
                  Quick Help
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="/faq" className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-medium mb-2" style={{ color: "#5A0117" }}>FAQ</h4>
                    <p className="text-sm text-gray-600">Find answers to commonly asked questions</p>
                  </a>
                  <a href="/returns" className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-medium mb-2" style={{ color: "#5A0117" }}>Return Policy</h4>
                    <p className="text-sm text-gray-600">Learn about our return and refund process</p>
                  </a>
                  <a href="/shipping" className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-medium mb-2" style={{ color: "#5A0117" }}>Shipping Info</h4>
                    <p className="text-sm text-gray-600">Check delivery options and timelines</p>
                  </a>
                  <a href="/profile/orders" className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                    <h4 className="font-medium mb-2" style={{ color: "#5A0117" }}>Track Order</h4>
                    <p className="text-sm text-gray-600">Monitor your order status in real-time</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
