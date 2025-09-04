import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#DBCCB7" }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
          404
        </h1>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#5A0117", fontFamily: "Sugar, serif" }}>
          Blog Post Not Found
        </h2>
        <p className="text-gray-600 mb-8" style={{ fontFamily: "Montserrat, sans-serif" }}>
          The blog post you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: "#5A0117" }}
        >
          ← Back to Blog
        </Link>
      </div>
    </div>
  )
}
