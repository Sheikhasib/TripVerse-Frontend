"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"
import Image from "next/image"

interface StatsStripProps {
  stats: {
    totalPackages: number
    totalCategories: number
    totalDestinations: number
    avgRating: number
  }
}

function CountUp({
  value,
  format,
}: {
  value: number
  format: (n: number) => string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: 1.6, bounce: 0 })
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!inView) return
    motionValue.set(value)
    return spring.on("change", (latest) => setDisplay(format(latest)))
  }, [inView, value, motionValue, spring, format])

  return <p ref={ref}>{display}</p>
}

const formatInt = (n: number) => Math.round(n).toLocaleString()
const formatRating = (n: number) => n.toFixed(1)

export function StatsStrip({ stats }: StatsStripProps) {
  const items = [
    { label: "Tour packages", value: stats.totalPackages, format: formatInt },
    { label: "Categories", value: stats.totalCategories, format: formatInt },
    { label: "Destinations", value: stats.totalDestinations, format: formatInt },
    {
      label: "Average rating",
      value: stats.avgRating,
      format: formatRating,
    },
  ]

  return (
    <section className="relative overflow-hidden bg-primary py-16">
      <Image
        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-15"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 text-center lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="font-display text-5xl font-medium tabular-nums text-primary-foreground">
                <CountUp value={item.value} format={item.format} />
              </p>
              <p className="mt-2 text-xs font-semibold tracking-widest text-primary-foreground/70 uppercase">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}