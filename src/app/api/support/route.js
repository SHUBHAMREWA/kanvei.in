import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request) {
  try {
    const { name, email, subject, message, category } = await request.json()

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "All required fields must be filled" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      )
    }

    // Create transporter (you'll need to configure this with your email service)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.SUPPORT_EMAIL_PASSWORD,
      },
    })

    // Email content for support team
    const supportEmailContent = `
      <h2>New Support Request</h2>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
    `

    // Email content for customer (auto-reply)
    const customerEmailContent = `
      <h2>Thank you for contacting Kanvei Support!</h2>
      <p>Dear ${name},</p>
      <p>We have received your support request and our team will get back to you within 24 hours.</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #5A0117; padding: 15px; margin: 20px 0;">
        <h3>Your Request Details:</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Message:</strong> ${message}</p>
      </div>
      
      <p>If you have any urgent concerns, please don't hesitate to call us at <strong>+91-1234-567-890</strong>.</p>
      
      <p>Best regards,<br>
      Kanvei Support Team</p>
      
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated response. Please do not reply to this email.
      </p>
    `

    // Send email to support team
    const supportMailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      subject: `Support Request: ${subject} [${category.toUpperCase()}]`,
      html: supportEmailContent,
    }

    // Send auto-reply to customer
    const customerMailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: email,
      subject: `Re: ${subject} - Support Request Received`,
      html: customerEmailContent,
    }

    // Try to send emails
    try {
      await transporter.sendMail(supportMailOptions)
      await transporter.sendMail(customerMailOptions)
      
      console.log('Support emails sent successfully')
      
      return NextResponse.json({
        success: true,
        message: "Your message has been sent successfully! We'll get back to you soon."
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      
      // Even if email fails, we can still log the support request
      // In a production app, you might want to save this to a database
      console.log('Support Request (Email failed):', {
        name,
        email,
        subject,
        message,
        category,
        timestamp: new Date().toISOString()
      })
      
      return NextResponse.json({
        success: true,
        message: "Your message has been received! We'll get back to you soon."
      })
    }

  } catch (error) {
    console.error('Support API error:', error)
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again later." },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
