export default function ReviewsList({ reviews, rating }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-bold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
            {rating.average.toFixed(1)}
          </div>
          <div>
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${star <= Math.round(rating.average) ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              Based on {rating.count} review{rating.count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold" style={{ fontFamily: "Sugar, serif", color: "#5A0117" }}>
                {review.userName}
              </h4>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-sm ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="mb-2" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
              {review.comment}
            </p>
            <p className="text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#AFABAA" }}>
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
