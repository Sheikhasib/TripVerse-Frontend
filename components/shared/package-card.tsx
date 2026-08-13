"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Clock, MapPin, Star, Compass } from "@phosphor-icons/react"
import type { TPublicPackage } from "@/lib/api/packages"

interface PackageCardProps {
  pkg: TPublicPackage
  rating?: number
  reviewCount?: number
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)

export function PackageCard({ pkg, rating, reviewCount }: PackageCardProps) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = pkg.images?.[0]

  return (
    <div className="group/card flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5 transition-all duration-300 hover:ring-primary/30 hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/packages/${pkg.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={pkg.title}
              fill
              className="object-cover transition-all duration-500 group-hover/card:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Compass size={48} className="text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
          {pkg.category && (
            <span className="absolute top-2 left-2 rounded bg-background/85 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-foreground backdrop-blur-sm">
              {pkg.category.name}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} />
            {pkg.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {pkg.duration} days
          </span>
        </div>

        <Link href={`/packages/${pkg.slug}`}>
          <h3 className="font-semibold tracking-wide truncate hover:text-primary transition-colors">
            {pkg.title}
          </h3>
        </Link>

        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {pkg.description}
        </p>

        {typeof rating === "number" && reviewCount !== undefined && (
          <div className="flex items-center gap-1.5">
            <Star size={14} weight="fill" className="text-accent" />
            <span className="text-xs font-semibold tabular-nums">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/60">
          <span className="font-semibold tabular-nums text-primary">
            {formatPrice(pkg.price)}
          </span>
          <Link
            href={`/packages/${pkg.slug}`}
            className="text-xs font-semibold tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}