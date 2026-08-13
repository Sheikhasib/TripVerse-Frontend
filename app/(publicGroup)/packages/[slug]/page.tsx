import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { packagesApi } from "@/lib/api/packages"
import { PackageImageGallery } from "./_components/package-image-gallery"
import { BookingPanel } from "./_components/booking-panel"
import { PackageCard } from "@/components/shared/package-card"
import { Rating } from "@/components/shared/rating"
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr"
import type { TPublicPackage } from "@/lib/api/packages"

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

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(pkg.price)

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
      <Link
        href="/packages"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft size={15} />
        Back to packages
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <PackageImageGallery images={pkg.images ?? []} title={pkg.title} />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {pkg.category && (
                <span className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  {pkg.category.name}
                </span>
              )}
              <span className="text-[10px] font-semibold tracking-widest uppercase text-primary">
                {pkg.duration} days · {pkg.location}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight leading-tight sm:text-4xl">
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
              <h2 className="text-2xl font-bold tracking-tight">Related Packages</h2>
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