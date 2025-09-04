import Link from "next/link"
import Image from "next/image"
import Header from "@/components/shared/Header"
import Footer from "@/components/shared/Footer"

async function getBlogs() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/blogs?published=true&sort=newest`,
      {
        cache: "no-store",
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch blogs")
    }

    const data = await response.json()
    return data.blogs || []
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return []
  }
}

export const metadata = {
  title: "Blog - KANVEI",
  description:
    "Discover the latest trends, tips, and insights from KANVEI. Explore our collection of articles on fashion, lifestyle, and more.",
  keywords: "KANVEI blog, fashion blog, lifestyle, trends, tips",
}

export default async function BlogPage() {
  const blogs = await getBlogs()

  return (
<>
<Header/>
    <div className="min-h-screen" style={{ backgroundColor: "#DBCCB7" }}>
      {/* Hero Section */}
      <div className="relative py-20 px-4" style={{ backgroundColor: "#5A0117" }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "Sugar, serif" }}>
            Kanvei Blog
          </h1>
          <p
            className="text-xl text-white opacity-90 max-w-2xl mx-auto"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Discover the latest trends, insights, and stories from the world of fashion, lifestyle, and beyond.
          </p>
        </div>
      </div>

      {/* Blog Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {blogs.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
              Coming Soon
            </h2>
            <p className="text-gray-600" style={{ fontFamily: "Montserrat, sans-serif" }}>
              We are working on bringing you amazing content. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        )}
      </div>
    </div>
    <Footer/>
</>
  )
}

function BlogCard({ blog }) {
  return (
    <Link href={`/blog/${blog.slug}`} className="group">
      <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Hero Image */}
        {blog.heroImage && (
          <div className="relative h-24 sm:h-36 md:h-48 overflow-hidden">
            <Image
              src={blog.heroImage || "/placeholder.svg"}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {blog.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: "#8C6141" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2
            className="text-sm sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 group-hover:opacity-80 transition-opacity line-clamp-2"
            style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}
          >
            {blog.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 text-xs sm:text-sm md:text-base" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {blog.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 gap-1 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              {blog.author && <span className="truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>By {blog.author}</span>}
              {blog.readTime && <span style={{ fontFamily: "Montserrat, sans-serif" }}>{blog.readTime} min</span>}
            </div>
            <span className="text-right" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
