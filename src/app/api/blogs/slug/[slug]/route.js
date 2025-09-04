import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb"
import Blog from "../../../../../lib/models/Blog.js"

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { slug } = params
    const blog = await Blog.findOne({ slug }).lean()

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error("Error fetching blog by slug:", error)
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 })
  }
}
