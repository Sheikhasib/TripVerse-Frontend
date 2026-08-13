import Link from "next/link"
import { MapPin } from "@phosphor-icons/react/dist/ssr"

interface DestinationMarqueeProps {
  locations: string[]
}

// Auto-scrolling strip of destination names, each linking to a filtered
// package listing. Runs on a linear infinite animation — pure CSS transform
// so it stays cheap and SSR-friendly.
export function DestinationMarquee({ locations }: DestinationMarqueeProps) {
  if (locations.length === 0) return null

  const doubled = [...locations, ...locations]

  return (
    <section className="overflow-hidden border-y border-border bg-muted/40 py-5">
      <div className="flex w-max motion-safe:animate-marquee">
        {doubled.map((location, i) => (
          <Link
            key={`${location}-${i}`}
            href={`/packages?location=${encodeURIComponent(location)}`}
            className="mx-6 inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <MapPin size={15} className="text-primary" />
            {location}
          </Link>
        ))}
      </div>
    </section>
  )
}