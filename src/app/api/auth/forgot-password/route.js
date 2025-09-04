import { NextResponse } from "next/server"
import dbConnect from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import OTP from "../../../../lib/models/OTP"
import { sendEmail } from "../../../../lib/email"

export async function POST(request) {
  await dbConnect()

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Step 1: Check if user exists
    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json({ success: false, error: "User with this email does not exist." }, { status: 404 })
    }

    // Step 2: User exists, so generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Delete any existing password reset OTPs for this user
    await OTP.deleteMany({ email, type: "password-reset" })

    // Save the new OTP to the database
    await OTP.create({
      email,
      otp: otpCode,
      type: "password-reset",
      expiresAt: new Date(Date.now() + 600000), // 10 minutes expiry
    })

    // Send the email with the OTP
    const subject = "Your Password Reset OTP for Kanvei"
    const htmlContent = `
      <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #5A0117; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-family: 'Sugar', serif; font-size: 32px;">Kanvei</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #5A0117; margin-bottom: 20px;">Password Reset Code</h2>
          <p style="color: #8C6141; margin-bottom: 30px;">
            You requested a password reset. Use the code below to set up a new password:
          </p>
          <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #5A0117; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Montserrat', sans-serif;">${otpCode}</h1>
          </div>
          <p style="color: #8C6141; font-size: 14px;">
            This code will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `

    await sendEmail(email, subject, htmlContent)

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email address.",
    })

  } catch (error) {
    console.error("Forgot Password (Send OTP) Error:", error)
    return NextResponse.json({ success: false, error: "An internal server error occurred." }, { status: 500 })
  }
}
