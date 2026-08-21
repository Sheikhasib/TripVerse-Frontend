"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Clock, MapPin, Star, Compass, Heart, Spinner } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { TPublicPackage } from "@/lib/api/packages"
import { ApiError } from "@/lib/api/client"
import { useRemoveFromWishlist } from "@/hooks/use-wishlist"
import { formatBDT } from "@/lib/format"

interface PackageCardProps {
  pkg: TPublicPackage
  rating?: number
  reviewCount?: number
  // Wishlist variant: overlays a filled-heart control that removes the
  // package from the wishlist. Default rendering stays untouched.
  wishlist?: boolean
}

export function PackageCard({ pkg, rating, reviewCount, wishlist }: PackageCardProps) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = pkg.images?.[0]
  const removeFromWishlist = useRemoveFromWishlist()

  const handleRemove = async () => {
    try {
      await removeFromWishlist.mutateAsync(pkg.id)
      toast.success("Removed from your wishlist.")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    }
  }

  return (
    <div className="group/card relative flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5 transition-all duration-300 hover:ring-primary/30 hover:shadow-lg hover:-translate-y-0.5">
      {wishlist && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={removeFromWishlist.isPending}
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
          className="absolute right-2 top-2 z-10 inline-flex cursor-pointer items-center justify-center rounded-full bg-background/85 p-2 text-primary backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-background active:scale-95 disabled:pointer-events-none disabled:opacity-60"
        >
          {removeFromWishlist.isPending ? (
            <Spinner size={16} className="animate-spin" />
          ) : (
            <Heart size={16} weight="fill" />
          )}
        </button>
      )}
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
          <h3 className="truncate font-display text-lg font-medium tracking-wide transition-colors group-hover/card:text-primary">
            {pkg.title}
          </h3>
        </Link>

        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {pkg.description}
        </p>

        {typeof rating === "number" && rating > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={14} weight="fill" className="text-accent" />
            <span className="text-xs font-semibold tabular-nums">
              {rating.toFixed(1)}
            </span>
            {typeof reviewCount === "number" && reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <span className="block text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              from
            </span>
            <span className="font-display text-lg font-medium tabular-nums text-primary">
              {formatBDT(Number(pkg.price))}
            </span>
          </div>
          <Link
            href={`/packages/${pkg.slug}`}
            className="text-xs font-semibold tracking-widest uppercase text-primary transition-colors hover:text-primary/80"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}