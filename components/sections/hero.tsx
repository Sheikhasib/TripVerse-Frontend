"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CaretDown, MapPin, Users } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { TPublicPackage } from "@/lib/api/packages"
import { formatBDT } from "@/lib/format"

interface HeroSectionProps {
  items: TPublicPackage[]
}

export function HeroSection({ items }: HeroSectionProps) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [destination, setDestination] = useState("")
  const [budget, setBudget] = useState("")
  const [duration, setDuration] = useState("")

  useEffect(() => {
    if (items.length <= 1 || paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [items.length, paused])

  const current = items[index]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (destination.trim()) params.set("search", destination.trim())
    if (budget) params.set("maxPrice", budget)
    if (duration) params.set("maxDuration", duration)
    const qs = params.toString()
    router.push(`/packages${qs ? `?${qs}` : ""}`)
  }

  return (
    <section
      className="relative flex min-h-[72svh] items-center overflow-hidden bg-gradient-to-b from-primary/5 to-background"
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
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.08 }}
                animate={{ scale: 1.15 }}
                transition={{ duration: 8, ease: "linear" }}
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
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">
            Curated by trusted local agents
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight leading-[0.95] sm:text-6xl lg:text-7xl">
            Explore the world,
            <span className="mt-2 block text-primary">one journey at a time</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground leading-relaxed">
            Discover hand-picked tour packages — beaches, treks, heritage walks
            and wildlife safaris — booked with confidence.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 flex flex-col gap-3 rounded-lg bg-background/80 p-3 shadow-lg ring-1 ring-foreground/10 backdrop-blur-md sm:flex-row sm:items-center"
          >
            <label className="flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-2.5 ring-1 ring-border">
              <MapPin size={18} className="shrink-0 text-primary" />
              <div className="flex-1">
                <span className="block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Destination
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Cox's Bazar, Sundarbans..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>

            <label className="flex w-full items-center gap-2 rounded-md bg-background px-3 py-2.5 ring-1 ring-border sm:w-40">
              <Users size={18} className="shrink-0 text-primary" />
              <div className="flex-1">
                <span className="block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Budget
                </span>
                <input
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Any"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>

            <label className="flex w-full items-center gap-2 rounded-md bg-background px-3 py-2.5 ring-1 ring-border sm:w-40">
              <div className="flex-1">
                <span className="block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Days
                </span>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Any"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </label>

            <Button size="lg" type="submit" className="sm:h-12">
              Search
              <ArrowRight />
            </Button>
          </form>
        </div>

        {current && (
          <div className="mt-8 flex max-w-xs items-center gap-3 rounded-lg bg-background/80 px-4 py-3 ring-1 ring-foreground/10 backdrop-blur-sm">
            {current.images?.[0] && (
              <Image
                src={current.images[0]}
                alt={current.title}
                width={56}
                height={42}
                className="h-[42px] w-14 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{current.title}</p>
              <p className="text-xs text-muted-foreground">
                {current.location} · from {formatBDT(Number(current.price))}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push("/packages")}
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-primary"
        aria-label="Scroll to explore packages"
      >
        <CaretDown size={28} className="animate-bounce" />
      </button>
    </section>
  )
}