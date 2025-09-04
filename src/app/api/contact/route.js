import { sendContactEmail } from "../../../lib/email"

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validation
    if (!name || !email || !subject || !message) {
      return Response.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Send email
    const result = await sendContactEmail(name, email, subject, message)

    if (result.success) {
      return Response.json({
        success: true,
        message: "Your message has been sent successfully!",
      })
    } else {
      return Response.json({ success: false, error: "Failed to send email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Contact form error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
