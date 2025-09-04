"use client"
import { useState } from "react"
import Header from "../../components/shared/Header"
import Footer from "../../components/shared/Footer"
import { FiChevronDown, FiChevronUp, FiHelpCircle } from "react-icons/fi"

export default function FAQPage() {
  const [openFAQ, setOpenFAQ] = useState(null)

  const faqs = [
    {
      category: "Orders & Payment",
      questions: [
        {
          question: "How do I place an order?",
          answer: "Browse products, add items to cart, proceed to checkout, fill in your details, select payment method and confirm your order. You'll receive a confirmation email with order details."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept credit/debit cards (Visa, MasterCard, American Express), net banking, UPI payments, wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery (COD) for eligible orders."
        },
        {
          question: "Can I modify or cancel my order?",
          answer: "Orders can be cancelled within 30 minutes of placing. For modifications, please contact our support team immediately. Once shipped, orders cannot be cancelled."
        },
        {
          question: "Is my payment information secure?",
          answer: "Yes, we use industry-standard SSL encryption and partner with trusted payment gateways. Your card details are not stored on our servers."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          question: "What are your delivery charges?",
          answer: "Standard delivery: ₹49 (Free on orders above ₹999). Express delivery: ₹99 (Free on orders above ₹1999). Same day delivery: ₹199 (available in select cities)."
        },
        {
          question: "How long does delivery take?",
          answer: "Standard delivery: 5-7 business days. Express delivery: 2-3 business days. Metro cities receive faster delivery. Rural areas may take 1-2 additional days."
        },
        {
          question: "Do you deliver to my location?",
          answer: "We deliver to most locations across India. Enter your pincode at checkout to verify delivery availability and estimated time."
        },
        {
          question: "Can I track my order?",
          answer: "Yes, you'll receive a tracking number via SMS and email once your order ships. Track your order in real-time through our website or app."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          question: "What is your return policy?",
          answer: "We offer 7-day easy returns for most items. Items must be unused, in original packaging with all tags. Initiate returns through My Orders section."
        },
        {
          question: "How do I return an item?",
          answer: "Go to My Orders, select the item, choose return reason, and schedule pickup. Keep items in original packaging. Refund processed after quality check."
        },
        {
          question: "When will I receive my refund?",
          answer: "Refunds are processed within 3-5 business days after the returned item passes our quality check. Amount is credited to your original payment method."
        },
        {
          question: "Are there any items that cannot be returned?",
          answer: "Yes, personal care products (opened), innerwear, swimwear, perishable items, and customized products cannot be returned for hygiene reasons."
        }
      ]
    },
    {
      category: "Account & Profile",
      questions: [
        {
          question: "How do I create an account?",
          answer: "Click 'Sign Up' on our website, enter your email and create a password, or sign up using Google/Facebook. Verify your email to activate your account."
        },
        {
          question: "I forgot my password. What should I do?",
          answer: "Click 'Forgot Password' on the login page, enter your registered email, and follow the reset instructions sent to your email."
        },
        {
          question: "How do I update my profile information?",
          answer: "Log in to your account, go to 'My Profile', and update your personal information, addresses, and preferences. Don't forget to save changes."
        },
        {
          question: "Can I have multiple delivery addresses?",
          answer: "Yes, you can add multiple addresses in your account. Select your preferred address during checkout or add a new one."
        }
      ]
    },
    {
      category: "Products & Pricing",
      questions: [
        {
          question: "Are the product images accurate?",
          answer: "We strive to display accurate product images. However, actual colors may vary slightly due to screen settings. Check product descriptions for detailed specifications."
        },
        {
          question: "Do you offer size charts?",
          answer: "Yes, size charts are available for clothing and footwear products. Click on 'Size Guide' on the product page to find the right fit."
        },
        {
          question: "Can I check product availability?",
          answer: "Product availability is shown on each product page. Items may go out of stock quickly during sales. Add items to cart to reserve them temporarily."
        },
        {
          question: "Do you offer bulk discounts?",
          answer: "Yes, we offer bulk discounts for large orders. Contact our sales team for custom quotations and wholesale pricing."
        }
      ]
    },
    {
      category: "Technical Issues",
      questions: [
        {
          question: "The website is not loading properly. What should I do?",
          answer: "Try refreshing the page, clearing your browser cache, or using a different browser. Check your internet connection. Contact support if the issue persists."
        },
        {
          question: "I'm having trouble placing an order.",
          answer: "Ensure all required fields are filled correctly, your payment method is valid, and you have sufficient funds. Try using a different payment method or browser."
        },
        {
          question: "The mobile app is not working.",
          answer: "Update the app to the latest version, restart your device, or reinstall the app. Ensure you have a stable internet connection."
        },
        {
          question: "I'm not receiving order confirmation emails.",
          answer: "Check your spam/junk folder, ensure the email address is correct in your profile, and add our email to your contacts. Contact support if needed."
        }
      ]
    }
  ]

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Find quick answers to common questions about our products, services, and policies.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "#5A0117" }}>
                    <FiHelpCircle className="w-5 h-5" />
                    {category.category}
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {category.questions.map((faq, questionIndex) => {
                    const faqIndex = `${categoryIndex}-${questionIndex}`
                    const isOpen = openFAQ === faqIndex
                    
                    return (
                      <div key={questionIndex}>
                        <button
                          onClick={() => toggleFAQ(faqIndex)}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
                        >
                          <span className="font-medium text-gray-900 pr-4">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <FiChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: "#5A0117" }} />
                          ) : (
                            <FiChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: "#5A0117" }} />
                          )}
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4" style={{ borderLeftColor: "#5A0117" }}>
                              <p className="text-gray-700 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-8 mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#5A0117" }}>
              Still have questions?
            </h2>
            <p className="text-gray-700 mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#5A0117" }}
              >
                Contact Support
              </a>
              <a
                href="mailto:support@kanvei.in"
                className="inline-flex items-center justify-center px-6 py-3 border-2 text-base font-medium rounded-md hover:bg-red-50 transition-colors"
                style={{ borderColor: "#5A0117", color: "#5A0117" }}
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
