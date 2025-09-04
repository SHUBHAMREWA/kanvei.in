import connectDB from "../../../../../lib/mongodb"
import User from "../../../../../lib/models/User"
import BlockedAccount from "../../../../../lib/models/BlockedAccount"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { getAuthUser } from "../../../../../lib/auth"

export async function POST(request) {
  try {
    await connectDB()
    
    // Check admin authentication via NextAuth session first
    const session = await getServerSession(authOptions)
    let isAdmin = Boolean(session && session.user?.role === "admin")
    let authUser = null
    let adminUserId = session?.user?.id
    
    console.log("🔍 Checking authentication:", {
      hasSession: !!session,
      sessionRole: session?.user?.role,
      sessionUserId: session?.user?.id
    })
    
    // If no NextAuth session, try JWT token authentication
    if (!isAdmin) {
      authUser = await getAuthUser(request)
      if (authUser?.userId) {
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
          adminUserId = authUser.userId
          console.log("✅ JWT admin authentication successful:", dbUser.email)
        }
      }
    } else {
      console.log("✅ NextAuth admin session found:", session.user.email)
    }

    if (!isAdmin) {
      console.log("❌ Blocked-status API: Unauthorized access", {
        hasSession: !!session,
        sessionRole: session?.user?.role,
        hasAuthHeader: !!request.headers.get("authorization"),
        authUserFound: !!authUser
      })
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("✅ Blocked-status API: Admin authenticated", {
      method: session?.user?.role === "admin" ? "NextAuth" : "JWT",
      adminId: session?.user?.id || authUser?.userId
    })

    const { userIds } = await request.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ success: false, error: "User IDs array is required" }, { status: 400 })
    }

    // Find all blocked accounts for the provided user IDs
    const blockedAccounts = await BlockedAccount.find({ 
      userId: { $in: userIds } 
    }).select('userId')

    const blockedUserIds = blockedAccounts.map(account => account.userId.toString())

    return Response.json({ 
      success: true, 
      blockedUsers: blockedUserIds
    })
  } catch (error) {
    console.error("Error fetching blocked status:", error)
    return Response.json({ success: false, error: "Failed to fetch blocked status" }, { status: 500 })
  }
}
