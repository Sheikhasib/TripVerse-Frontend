import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Compass } from "@phosphor-icons/react/dist/ssr"
import { SectionHeading } from "@/components/shared/section-heading"
import type { TCategory } from "@/lib/api/packages"

interface CategoryGridProps {
  categories: TCategory[]
  // Representative image per category slug (first package image), so tiles
  // stay image-backed even though the categories endpoint has no images.
  imagesBySlug?: Record<string, string>
}

export function CategoryGrid({ categories, imagesBySlug = {} }: CategoryGridProps) {
  return (
    <section
      id="categories"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8"
    >
      <SectionHeading
        eyebrow="Browse by Category"
        title="Find your kind of escape"
        subtitle="From sun-soaked beaches to misty hill treks"
        href="/packages"
        linkLabel="View All Packages"
      />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {categories.map((category) => {
          const image = imagesBySlug[category.slug]
          return (
            <Link
              key={category.id}
              href={`/packages?category=${category.slug}`}
              className="group relative flex h-40 flex-col justify-end overflow-hidden rounded-lg ring-1 ring-foreground/5 transition-all duration-300 hover:ring-primary/30 hover:shadow-lg sm:h-48"
            >
              {image ? (
                <Image
                  src={image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-all duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <Compass size={40} className="text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="relative z-10 flex items-end justify-between gap-2 p-4">
                <div>
                  <span className="block text-xs font-semibold tracking-widest uppercase text-white/70">
                    {category._count?.packages ?? 0}{" "}
                    {category._count?.packages === 1 ? "package" : "packages"}
                  </span>
                  <span className="block text-lg font-semibold tracking-wide text-white">
                    {category.name}
                  </span>
                </div>
                <ArrowRight
                  size={20}
                  className="shrink-0 text-white transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}