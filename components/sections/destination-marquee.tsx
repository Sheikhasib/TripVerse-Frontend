import Link from "next/link"
import { MapPin } from "@phosphor-icons/react/dist/ssr"

interface DestinationMarqueeProps {
  locations: string[]
}

// Auto-scrolling strip of destination names, each linking to a filtered
// package listing. Runs on a linear infinite animation — pure CSS transform
// so it stays cheap and SSR-friendly. Slow drift + serif names give it a
// retro travel-poster feel.
export function DestinationMarquee({ locations }: DestinationMarqueeProps) {
  if (locations.length === 0) return null

  const doubled = [...locations, ...locations]

  return (
    <section className="overflow-hidden border-y border-border bg-background py-6">
      <div className="flex w-max motion-safe:animate-marquee-slow">
        {doubled.map((location, i) => (
          <Link
            key={`${location}-${i}`}
            href={`/packages?location=${encodeURIComponent(location)}`}
            className="mx-8 inline-flex items-center gap-3 whitespace-nowrap font-display text-xl font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <MapPin size={18} className="text-primary" />
            {location}
          </Link>
        ))}
      </div>
    </section>
  )
}