"use client"

import { useRef, useState } from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { SectionHeading } from "@/components/shared/section-heading"
import { PackageCard } from "@/components/shared/package-card"
import type { TPublicPackage } from "@/lib/api/packages"

interface FeaturedPackagesProps {
  packages: TPublicPackage[]
}

// Horizontal scroll-snap carousel with prev/next buttons. SSR-renders the
// full grid, then scrolls on interaction — no layout shift, no duplication.
export function FeaturedPackages({ packages }: FeaturedPackagesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-card]")
    const width = card?.offsetWidth ?? 340
    el.scrollBy({ left: dir * (width + 24), behavior: "smooth" })
  }

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 0)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Featured Destinations"
          title="Trending packages"
          subtitle="Top picks our travellers book the most"
        />
        <div className="mb-10 hidden shrink-0 gap-2 sm:flex">
          <CarouselButton
            direction="prev"
            disabled={!canPrev}
            onClick={() => scrollByCard(-1)}
          />
          <CarouselButton
            direction="next"
            disabled={!canNext}
            onClick={() => scrollByCard(1)}
          />
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            data-card
            className="w-full max-w-[320px] shrink-0 snap-start sm:w-[320px]"
          >
            <PackageCard pkg={pkg} rating={pkg.rating} />
          </div>
        ))}
      </div>
    </section>
  )
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === "prev" ? "Scroll left" : "Scroll right"}
      className="flex size-10 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
    >
      {direction === "prev" ? <CaretLeft size={18} /> : <CaretRight size={18} />}
    </button>
  )
}