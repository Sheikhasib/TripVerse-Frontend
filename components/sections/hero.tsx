"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CaretDown, Star } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { TPublicPackage } from "@/lib/api/packages"
import { formatBDT } from "@/lib/format"

interface HeroSectionProps {
  items: TPublicPackage[]
}

// Cinematic, editorial hero: one full-bleed destination photograph at a time
// with a slow Ken Burns drift, a single emotional headline in the display
// serif, one CTA — and no search form. Search lives in the navbar.
export function HeroSection({ items }: HeroSectionProps) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (items.length <= 1 || paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [items.length, paused])

  const current = items[index]

  return (
    <section
      className="relative flex min-h-[92svh] items-center justify-center overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {current?.images?.[0] && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
              className="absolute inset-0"
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.06 }}
                animate={{ scale: 1.14 }}
                transition={{ duration: 9, ease: "linear" }}
              >
                <Image
                  src={current.images[0]}
                  alt={current.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs font-semibold tracking-[0.3em] uppercase text-primary"
        >
          TripVerse — Curated travel
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          Somewhere in Bangladesh, the tide is coming in.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Hand-picked escapes — beaches, misty hills and wild mangroves —
          booked with confidence, guided by trusted local agents.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Button size="lg" onClick={() => router.push("/packages")}>
            Explore trips
            <ArrowRight />
          </Button>
          {current && (
            <div className="hidden items-center gap-3 rounded-full bg-background/70 px-5 py-2.5 ring-1 ring-foreground/10 backdrop-blur-sm sm:flex">
              <span className="text-sm font-medium">{current.title}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-accent text-accent" weight="fill" />
                {current.rating?.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-primary">
                from {formatBDT(Number(current.price))}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/packages")}
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-primary"
        aria-label="Scroll to explore packages"
      >
        <CaretDown size={28} className="animate-bounce" />
      </button>
    </section>
  )
}