"use client"

import { useState } from "react"
import Image from "next/image"
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
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        {current && !error ? (
          <Image
            src={current}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Compass size={56} className="text-muted-foreground/30" />
          </div>
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
                i === active ? "ring-primary" : "ring-transparent hover:ring-primary/40",
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