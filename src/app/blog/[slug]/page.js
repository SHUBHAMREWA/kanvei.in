import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/shared/Header"
import Footer from "@/components/shared/Footer"

async function getBlog(slug) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/blogs/slug/${slug}`,
      {
        cache: "no-store",
      },
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching blog:", error)
    return null
  }
}

async function getRelatedBlogs(currentSlug, tags = []) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/blogs?published=true&limit=3`,
      {
        cache: "no-store",
      },
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return (data.blogs || []).filter((blog) => blog.slug !== currentSlug).slice(0, 3)
  } catch (error) {
    console.error("Error fetching related blogs:", error)
    return []
  }
}

export async function generateMetadata({ params }) {
  const blog = await getBlog(params.slug)

  if (!blog) {
    return {
      title: "Blog Not Found - KANVEI",
    }
  }

  return {
    title: blog.metaTitle || `${blog.title} - KANVEI Blog`,
    description: blog.metaDescription || blog.description,
    keywords: blog.tags?.join(", "),
    openGraph: {
      title: blog.title,
      description: blog.description,
      images: blog.heroImage ? [blog.heroImage] : [],
      type: "article",
      publishedTime: blog.publishedAt || blog.createdAt,
      authors: blog.author ? [blog.author] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.description,
      images: blog.heroImage ? [blog.heroImage] : [],
    },
  }
}

export default async function BlogPost({ params }) {
  const blog = await getBlog(params.slug)

  if (!blog || !blog.published) {
    notFound()
  }

  const relatedBlogs = await getRelatedBlogs(blog.slug, blog.tags)

  // Helper function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    // Handle different YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('youtube.com/watch?v=', 'youtube.com/embed/')
    } else if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/')
    } else if (url.includes('youtube.com/embed/')) {
      return url // Already in embed format
    }
    return url // Return original if format not recognized
  }

  return (
    <>
      {/* <Header /> */}
      
      {/* Blog Navigation Bar */}
      <div className="bg-white/60 backdrop-blur-md shadow-sm border-b border-gray-200/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <a 
                href="https://kanvei.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-2xl font-bold tracking-wide hover:opacity-80 transition-opacity"
                style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}
              >
                Kanvei
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/blog" 
                className="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                style={{ backgroundColor: "#8C6141", fontFamily: "Montserrat, sans-serif" }}
              >
                📚 All Articles
              </Link>
              <a 
                href="https://kanvei.in/products" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                style={{ backgroundColor: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                🛍️ Latest Products
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen" style={{ backgroundColor: "#DBCCB7" }}>
        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Blog Title */}
          <h1
            className="text-4xl md:text-5xl font-bold mb-8 text-center"
            style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}
          >
            {blog.title}
          </h1>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-200">
            {blog.author && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#5A0117" }}>
                  By
                </span>
                <span className="text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {blog.author}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "#5A0117" }}>
                Published
              </span>
              <span className="text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {blog.readTime && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#5A0117" }}>
                  Read time
                </span>
                <span className="text-sm" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {blog.readTime} min
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm rounded-full text-white"
                  style={{ backgroundColor: "#8C6141" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mb-8">
            <p className="text-lg leading-relaxed text-gray-700" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {blog.description}
            </p>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div
              className="text-gray-800 leading-relaxed"
              style={{ fontFamily: "Montserrat, sans-serif" }}
              dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, "<br />") }}
            />
          </div>

          {/* YouTube Links */}
          {blog.youtubeLinks && blog.youtubeLinks.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                Related Videos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blog.youtubeLinks.map((link, index) => (
                  <div key={index} className="aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(link)}
                      title={`Video ${index + 1}`}
                      className="w-full h-full rounded-lg border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Links */}
          {blog.additionalLinks && blog.additionalLinks.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
                Additional Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blog.additionalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl">🔗</span>
                    <div>
                      <div className="font-medium" style={{ color: "#5A0117" }}>
                        {link.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{link.url}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="pt-8 border-t border-gray-200">
            <a
              href="https://kanvei.in/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#5A0117" }}
            >
              ← Back to Blog
            </a>
          </div>
        </div>

        {/* Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16">
            <h2
              className="text-3xl font-bold mb-8 text-center"
              style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}
            >
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedBlogs.map((relatedBlog) => (
                <Link key={relatedBlog._id} href={`/blog/${relatedBlog.slug}`} className="group">
                  <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {relatedBlog.heroImage && (
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={relatedBlog.heroImage || "/placeholder.svg"}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3
                        className="font-bold mb-2 group-hover:opacity-80 transition-opacity"
                        style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}
                      >
                        {relatedBlog.title}
                      </h3>
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                      >
                        {relatedBlog.description}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
      
      <Footer />
    </>
  )
}
