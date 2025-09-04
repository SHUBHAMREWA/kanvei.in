import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import OTP from "../../../../lib/models/OTP"
import { sendEmail } from "../../../../lib/email"

export async function POST(request) {
  try {
    await connectDB()
    const { email, type } = await request.json()

    if (!email || !type) {
      return NextResponse.json({ success: false, error: "Email and type are required" }, { status: 400 })
    }

    // For login OTP, check if user exists
    if (type === "login") {
      const existingUser = await User.findOne({ email })
      if (!existingUser) {
        return NextResponse.json({ success: false, error: "No account found with this email" }, { status: 404 })
      }
    }

    // For register OTP, check if user already exists
    if (type === "register") {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return NextResponse.json({ success: false, error: "Account already exists with this email" }, { status: 400 })
      }
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type })

    // Create new OTP
    await OTP.create({
      email,
      otp: otpCode,
      type,
    })

    // Send OTP email
    const subject = type === "login" ? "Your Kanvei Login OTP" : "Your Kanvei Registration OTP"
    const html = `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #5A0117; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-family: 'Sugar', serif; font-size: 32px;">Kanvei</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #5A0117; margin-bottom: 20px;">Your OTP Code</h2>
          <p style="color: #8C6141; margin-bottom: 30px;">
            ${type === "login" ? "Use this code to sign in to your account:" : "Use this code to complete your registration:"}
          </p>
          <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #5A0117; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Montserrat', sans-serif;">${otpCode}</h1>
          </div>
          <p style="color: #8C6141; font-size: 14px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
      </div>
    `

    await sendEmail(email, subject, html)

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 })
  }
}
