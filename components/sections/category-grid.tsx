import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Compass } from "@phosphor-icons/react/dist/ssr"
import { SectionHeading } from "@/components/shared/section-heading"
import { cn } from "@/lib/utils"
import type { TCategory } from "@/lib/api/packages"

interface CategoryGridProps {
  categories: TCategory[]
  // Representative image per category slug (first package image), so tiles
  // stay image-backed even though the categories endpoint has no images.
  imagesBySlug?: Record<string, string>
}

// Editorial, photo-led category tiles: the first category becomes a tall
// feature tile spanning two rows; the rest flow as landscape cards. Serif
// names over a scrim give the section a travel-magazine feel.
export function CategoryGrid({
  categories,
  imagesBySlug = {},
}: CategoryGridProps) {
  const [feature, ...rest] = categories

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
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:grid-rows-2">
        {feature && (
          <CategoryTile
            category={feature}
            image={imagesBySlug[feature.slug]}
            className="col-span-2 row-span-2 min-h-80 lg:min-h-full"
          />
        )}
        {rest.slice(0, 6).map((category) => (
          <CategoryTile
            key={category.id}
            category={category}
            image={imagesBySlug[category.slug]}
            className="h-40 sm:h-48"
          />
        ))}
      </div>
    </section>
  )
}

function CategoryTile({
  category,
  image,
  className,
}: {
  category: TCategory
  image?: string
  className?: string
}) {
  return (
    <Link
      href={`/packages?category=${category.slug}`}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-lg ring-1 ring-foreground/5 transition-all duration-300 hover:ring-primary/30 hover:shadow-lg",
        className,
      )}
    >
      {image ? (
        <Image
          src={image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-all duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted">
          <Compass size={40} className="text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      <div className="relative z-10 flex items-end justify-between gap-2 p-4 sm:p-5">
        <div>
          <span className="block text-[11px] font-semibold tracking-widest text-white/70 uppercase">
            {category._count?.packages ?? 0}{" "}
            {category._count?.packages === 1 ? "package" : "packages"}
          </span>
          <span className="mt-0.5 block font-display text-xl font-medium tracking-wide text-white sm:text-2xl">
            {category.name}
          </span>
        </div>
        <ArrowUpRight
          size={20}
          className="shrink-0 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  )
}