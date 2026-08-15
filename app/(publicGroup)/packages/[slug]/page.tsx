import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { packagesApi } from "@/lib/api/packages"
import { PackageImageGallery } from "./_components/package-image-gallery"
import { BookingPanel } from "./_components/booking-panel"
import { PackageCard } from "@/components/shared/package-card"
import { Rating } from "@/components/shared/rating"
import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr"
import { GoBack } from "@/components/shared/go-back"
import type { TPublicPackage } from "@/lib/api/packages"
import { formatBDT } from "@/lib/format"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPackage(slug: string): Promise<TPublicPackage | null> {
  try {
    return await packagesApi.getBySlug(slug)
  } catch {
    return null
  }
}

async function getRelated(pkg: TPublicPackage): Promise<TPublicPackage[]> {
  try {
    const res = await packagesApi.getList({
      category: pkg.category?.slug,
      limit: 4,
    })
    return (res.data ?? []).filter((item) => item.id !== pkg.id).slice(0, 3)
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPackage(slug)
  if (!pkg) {
    return { title: "Package not found" }
  }

  const price = formatBDT(Number(pkg.price))

  return {
    title: pkg.title,
    description: `${pkg.location} · ${pkg.duration} days · from ${price} — ${pkg.description.slice(0, 140)}`,
  }
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params
  const pkg = await getPackage(slug)
  if (!pkg) notFound()

  const related = await getRelated(pkg)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <GoBack
        href="/packages"
        label="Back to packages"
        className="mb-6"
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <PackageImageGallery images={pkg.images ?? []} title={pkg.title} />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {pkg.category && (
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-widest uppercase text-primary">
                  {pkg.category.name}
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                {pkg.duration} days
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <MapPin size={13} className="text-primary" />
                {pkg.location}
              </span>
            </div>

            <h1 className="font-display text-3xl font-medium tracking-tight leading-tight sm:text-4xl">
              {pkg.title}
            </h1>

            {typeof pkg.rating === "number" && pkg.rating > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Rating value={pkg.rating} size={16} />
                <span className="font-semibold tabular-nums">
                  {pkg.rating.toFixed(1)}
                </span>
              </div>
            )}

            <Link
              href={`/packages/${slug}/reviews`}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold tracking-widest text-primary uppercase transition-colors duration-200 hover:text-primary/80"
            >
              View all reviews <ArrowRight size={13} />
            </Link>

            {pkg.agent && (
              <p className="text-sm text-muted-foreground">
                Curated by{" "}
                <span className="font-medium text-foreground">
                  {pkg.agent.name}
                </span>
              </p>
            )}

            <p className="max-w-prose leading-relaxed text-muted-foreground">
              {pkg.description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <BookingPanel pkg={pkg} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-tight">
                Related Packages
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                More from {pkg.category?.name ?? "this category"}
              </p>
            </div>
            <Link
              href={`/packages?category=${pkg.category?.slug ?? ""}`}
              className="inline-flex items-center gap-1 text-xs font-semibold tracking-widest uppercase text-primary transition-colors hover:text-primary/80"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PackageCard key={item.id} pkg={item} rating={item.rating} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}