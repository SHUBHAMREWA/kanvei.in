import connectDB from "../../../lib/mongodb"
import User from "../../../lib/models/User"
import bcrypt from "bcryptjs"

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const dateFilter = searchParams.get("dateFilter")
    const customStart = searchParams.get("customStart")
    const customEnd = searchParams.get("customEnd")

    // Build filter
    const filter = {}
    
    // Search filter - search by name, email, or phone
    if (search && search.trim()) {
      const searchTerm = search.trim()
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    // Date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      let startDate

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          filter.createdAt = { $gte: startDate }
          break
        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          const yesterdayEnd = new Date(yesterdayStart)
          yesterdayEnd.setDate(yesterdayEnd.getDate() + 1)
          filter.createdAt = { $gte: yesterdayStart, $lt: yesterdayEnd }
          break
        case 'last_7_days':
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 7)
          filter.createdAt = { $gte: startDate }
          break
        case 'last_30_days':
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 30)
          filter.createdAt = { $gte: startDate }
          break
        case 'last_3_months':
          startDate = new Date(now)
          startDate.setMonth(startDate.getMonth() - 3)
          filter.createdAt = { $gte: startDate }
          break
        case 'last_6_months':
          startDate = new Date(now)
          startDate.setMonth(startDate.getMonth() - 6)
          filter.createdAt = { $gte: startDate }
          break
        case 'last_year':
          startDate = new Date(now)
          startDate.setFullYear(startDate.getFullYear() - 1)
          filter.createdAt = { $gte: startDate }
          break
        case 'custom':
          if (customStart && customEnd) {
            const startDateCustom = new Date(customStart)
            const endDateCustom = new Date(customEnd)
            endDateCustom.setHours(23, 59, 59, 999)
            filter.createdAt = { $gte: startDateCustom, $lte: endDateCustom }
          }
          break
      }
    }

    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .lean()
    
    return Response.json({ success: true, users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const userData = await request.json()
    
    // Validate required fields
    if (!userData.name || !userData.email) {
      return Response.json({ success: false, error: "Name and email are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() })
    if (existingUser) {
      return Response.json({ success: false, error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password if provided
    if (userData.password) {
      const saltRounds = 10
      userData.password = await bcrypt.hash(userData.password, saltRounds)
    }

    // Create the user
    const user = await User.create(userData)
    
    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    return Response.json({ 
      success: true, 
      message: "User created successfully",
      user: userResponse 
    })
  } catch (error) {
    console.error('User creation error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
