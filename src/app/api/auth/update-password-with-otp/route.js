import { NextResponse } from "next/server"
import dbConnect from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import OTP from "../../../../lib/models/OTP"
import bcrypt from "bcryptjs"

export async function POST(request) {
  await dbConnect()

  try {
    const { email, otp, password } = await request.json()

    if (!email || !otp || !password) {
      return NextResponse.json({ success: false, error: "Email, OTP, and new password are required" }, { status: 400 })
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character.",
        },
        { status: 400 }
      )
    }

    // Find the most recent, valid OTP for this email and type
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type: "password-reset",
      expiresAt: { $gt: new Date() }, // Check if the token is not expired
    })

    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP." }, { status: 400 })
    }

    // Find the user
    const user = await User.findOne({ email })
    if (!user) {
      // This case should ideally not be reached if OTP is valid, but it's a good safeguard.
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update the user's password
    user.password = hashedPassword
    await user.save()

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id })

    return NextResponse.json({ success: true, message: "Password has been updated successfully." })

  } catch (error) {
    console.error("Update Password with OTP Error:", error)
    return NextResponse.json({ success: false, error: "An internal server error occurred." }, { status: 500 })
  }
}
