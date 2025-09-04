import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import BlockedAccount from "./models/BlockedAccount"

const { JWT_SECRET } = process.env
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Please configure it in your environment.")
}

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12)
}

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const getAuthUser = async (request) => {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token) 

    if (!decoded) {
      return null
    }

    return decoded
  } catch (error) {
    return null
  }
}

// Check if user account is blocked
export const isUserBlocked = async (userId) => {
  try {
    if (!userId) return { isBlocked: false }
    
    const result = await BlockedAccount.isUserBlocked(userId)
    return result
  } catch (error) {
    console.error("Error checking blocked status:", error)
    return { isBlocked: false }
  }
}

// Validate user is not blocked before authentication
export const validateUserNotBlocked = async (userId) => {
  const blockStatus = await isUserBlocked(userId)
  if (blockStatus.isBlocked) {
    const blockedAt = blockStatus.blockedAccount?.blockedAt
    const reason = blockStatus.blockedAccount?.reason || "Account blocked by administrator"
    return {
      success: false,
      error: `Your account has been blocked. Reason: ${reason}. Contact support for assistance.`,
      blockedAt
    }
  }
  return { success: true }
}
