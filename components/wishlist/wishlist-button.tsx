"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Spinner } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { useMe } from "@/hooks/use-me"
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistSaved,
} from "@/hooks/use-wishlist"

interface WishlistButtonProps {
  packageId: string
  className?: string
  size?: number
}

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Something went wrong."

// Heart control for saving a package. Anonymous visitors get a login CTA that
// returns them to this page after signing in; signed-in users toggle save.
export function WishlistButton({
  packageId,
  className,
  size = 20,
}: WishlistButtonProps) {
  const pathname = usePathname()
  const { user } = useMe()
  const { data: saved = false, isLoading: savedLoading } =
    useWishlistSaved(packageId)
  const addToWishlist = useAddToWishlist()
  const removeFromWishlist = useRemoveFromWishlist()

  if (!user) {
    return (
      <Link
        href={`/login?redirectTo=${encodeURIComponent(pathname)}`}
        aria-label="Save to wishlist"
        title="Save to wishlist"
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-primary",
          className,
        )}
      >
        <Heart size={size} />
      </Link>
    )
  }

  const pending = addToWishlist.isPending || removeFromWishlist.isPending

  const toggle = async () => {
    try {
      if (saved) {
        await removeFromWishlist.mutateAsync(packageId)
        toast.success("Removed from your wishlist.")
      } else {
        await addToWishlist.mutateAsync(packageId)
        toast.success("Saved to your wishlist.")
      }
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={toggle}
      disabled={pending || savedLoading}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full border p-2.5 transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60",
        saved
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
        className,
      )}
    >
      {pending ? (
        <Spinner size={size} className="animate-spin" />
      ) : (
        <Heart size={size} weight={saved ? "fill" : "regular"} />
      )}
    </motion.button>
  )
}
