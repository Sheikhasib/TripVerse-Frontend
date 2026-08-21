"use client"

import { useState } from "react"
import Link from "next/link"
import { Compass, Heart } from "@phosphor-icons/react"
import { ApiError } from "@/lib/api/client"
import { useWishlist } from "@/hooks/use-wishlist"
import { PackageCard } from "@/components/shared/package-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/shared/pagination"

const SKELETON_COUNT = 6

const WishlistCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
    <div className="aspect-[4/3] animate-pulse bg-muted" />
    <div className="flex-1 space-y-3 p-4">
      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  </div>
)

export default function WishlistPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useWishlist({ page })

  const items = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const errorMessage =
    error instanceof ApiError ? error.message : "Something went wrong."

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Wishlist
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trips you&apos;ve hearted for later — book them whenever you&apos;re ready.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <WishlistCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Heart size={40} />}
          title="Couldn't load your wishlist"
          description={errorMessage}
          action={
            <Button type="button" onClick={() => refetch()} className="cursor-pointer">
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={40} />}
          title="No saved packages yet"
          description="Heart the trips you love and they'll be waiting for you here."
          action={
            <Button asChild className="cursor-pointer">
              <Link href="/packages">
                <Compass size={16} className="mr-2" />
                Browse trips
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <PackageCard
                key={item.id}
                pkg={item.package}
                rating={item.package.rating}
                wishlist
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
