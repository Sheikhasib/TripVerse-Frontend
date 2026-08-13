import { Star } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  size?: number
  className?: string
}

// Star display used on cards, details, and testimonials. Fills stars up to the
// (rounded half) rating, so 4.7 shows 5 stars and 4.3 shows 4.
export function Rating({ value, size = 14, className }: RatingProps) {
  const filled = Math.round(value)

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          weight={star <= filled ? "fill" : "regular"}
          className={star <= filled ? "text-accent" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  )
}