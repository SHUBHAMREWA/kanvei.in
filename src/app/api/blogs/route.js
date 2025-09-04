import { NextResponse } from "next/server"
import connectDB from "../../../lib/mongodb"
import Blog, { BlogUtils } from "../../../lib/models/Blog.js"

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const published = searchParams.get("published")
    const limit = Number.parseInt(searchParams.get("limit")) || 0
    const page = Number.parseInt(searchParams.get("page")) || 1
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "newest"

    const skip = (page - 1) * (limit || 0)

    let sortOptions = { createdAt: -1 }
    if (sort === "oldest") sortOptions = { createdAt: 1 }
    if (sort === "title") sortOptions = { title: 1 }

    const options = {
      published: published === "true" ? true : published === "false" ? false : null,
      limit,
      skip,
      sort: sortOptions,
      search,
    }

    const query = {}
    if (options.published !== null) query.published = options.published
    if (options.search) {
      query.$or = [
        { title: { $regex: options.search, $options: "i" } },
        { description: { $regex: options.search, $options: "i" } },
        { tags: { $in: [new RegExp(options.search, "i")] } },
      ]
    }

    const blogs = await Blog.find(query)
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit)
      .lean()
    const totalCount = await Blog.countDocuments(options.published !== null ? { published: options.published } : {})

    return NextResponse.json({
      blogs,
      pagination: {
        total: totalCount,
        page,
        limit: limit || totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1,
      },
    })
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const data = await request.json()

    // Generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = BlogUtils.generateSlug(data.title)
    }

    // Calculate read time if content is provided
    if (data.content) {
      data.readTime = BlogUtils.calculateReadTime(data.content)
    }

    // Set published date if publishing
    if (data.published && !data.publishedAt) {
      data.publishedAt = new Date()
    }

    const savedBlog = await Blog.create(data)

    return NextResponse.json(savedBlog, { status: 201 })
  } catch (error) {
    console.error("Error creating blog:", error)
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 })
  }
}
