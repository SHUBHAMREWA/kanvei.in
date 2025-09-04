import Link from "next/link"

export default function StatsCard({ title, value, icon, color = "#5A0117", href }) {
  const CardContent = () => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-70" style={{ fontFamily: "Montserrat, sans-serif", color }}>
          {title}
        </p>
        <p className="text-3xl font-bold mt-1" style={{ fontFamily: "Sugar, serif", color }}>
          {value}
        </p>
      </div>
      <div className="text-3xl opacity-70">{icon}</div>
    </div>
  )

  if (href) {
    return (
      <Link href={href}>
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transform transition-transform">
          <CardContent />
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <CardContent />
    </div>
  )
}
