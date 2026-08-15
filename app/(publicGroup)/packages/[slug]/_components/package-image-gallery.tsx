"use client"

import { useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Compass } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface PackageImageGalleryProps {
  images: string[]
  title: string
}

export function PackageImageGallery({ images, title }: PackageImageGalleryProps) {
  const [active, setActive] = useState(0)
  const [error, setError] = useState(false)
  const current = images[active]

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        <AnimatePresence mode="wait">
          {current && !error ? (
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <Image
                src={current}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                onError={() => setError(true)}
              />
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Compass size={56} className="text-muted-foreground/30" />
            </div>
          )}
        </AnimatePresence>

        {images.length > 1 && !error && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((image, i) => (
            <button
              key={image + i}
              type="button"
              onClick={() => {
                setActive(i)
                setError(false)
              }}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-20 w-28 shrink-0 overflow-hidden rounded-md ring-2 transition-all",
                i === active
                  ? "ring-primary"
                  : "ring-transparent opacity-70 hover:opacity-100 hover:ring-primary/40",
              )}
            >
              <Image
                src={image}
                alt={`${title} ${i + 1}`}
                fill
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}