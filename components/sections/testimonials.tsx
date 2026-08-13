"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Quotes } from "@phosphor-icons/react"
import { SectionHeading } from "@/components/shared/section-heading"
import { Rating } from "@/components/shared/rating"

export interface Testimonial {
  name: string
  rating: number
  comment: string
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
}

// Auto-rotating testimonial spotlight with a quote card. Falls back to the
// first item and pauses on hover — no navigation needed for the MVP.
export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (testimonials.length <= 1 || paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [testimonials.length, paused])

  if (testimonials.length === 0) return null

  const current = testimonials[index]

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Testimonials"
        title="What travellers say"
        subtitle="Real reviews from completed trips"
        align="center"
      />
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Quotes
          size={48}
          className="absolute -top-4 left-4 text-primary/20"
        />
        <AnimatePresence mode="wait">
          <motion.figure
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 text-center ring-1 ring-foreground/5 sm:p-12"
          >
            <Rating value={current.rating} size={18} />
            <blockquote className="max-w-2xl text-base text-muted-foreground leading-relaxed">
              &ldquo;{current.comment}&rdquo;
            </blockquote>
            <figcaption className="text-xs font-semibold tracking-widest uppercase text-primary">
              {current.name}
            </figcaption>
          </motion.figure>
        </AnimatePresence>

        {testimonials.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show testimonial ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}