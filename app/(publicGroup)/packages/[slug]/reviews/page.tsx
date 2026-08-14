import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { packagesApi } from "@/lib/api/packages"
import { ReviewList } from "@/components/shared/review-list"
import { ReviewForm } from "@/components/review/review-form"
import { Rating } from "@/components/shared/rating"
import { GoBack } from "@/components/shared/go-back"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const pkg = await packagesApi.getBySlug(slug)
    return { title: `${pkg.title} — Reviews` }
  } catch {
    return { title: "Reviews" }
  }
}

export default async function PackageReviewsPage({ params }: PageProps) {
  const { slug } = await params

  let pkg
  try {
    pkg = await packagesApi.getBySlug(slug)
  } catch {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <GoBack
        href={`/packages/${slug}`}
        label={`Back to ${pkg.title}`}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Reviews
        </h1>
        {typeof pkg.rating === "number" && pkg.rating > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Rating value={pkg.rating} size={18} />
            <span className="text-sm font-semibold tabular-nums">
              {pkg.rating.toFixed(1)} average rating
            </span>
          </div>
        )}
        <p className="mt-2 text-muted-foreground">
          What travellers say about {pkg.title}
        </p>
      </div>

      <ReviewForm packageId={pkg.id} slug={slug} />

      <ReviewList packageId={pkg.id} />
    </div>
  )
}