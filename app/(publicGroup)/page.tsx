import { packagesApi } from "@/lib/api/packages"
import { reviewsApi } from "@/lib/api/reviews"
import { blogApi } from "@/lib/api/blog"
import { HeroSection } from "@/components/sections/hero"
import { CategoryGrid } from "@/components/sections/category-grid"
import { FeaturedPackages } from "@/components/sections/featured-packages"
import { DestinationMarquee } from "@/components/sections/destination-marquee"
import { HowItWorks } from "@/components/sections/how-it-works"
import { StatsStrip } from "@/components/sections/stats-strip"
import { TestimonialCarousel, type Testimonial } from "@/components/sections/testimonials"
import { BlogTeaser } from "@/components/sections/blog-teaser"
import { FaqSection } from "@/components/sections/faq"
import { CtaBand } from "@/components/sections/cta-band"
import type { TPublicPackage } from "@/lib/api/packages"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  description:
    "Discover hand-picked tour packages — beaches, treks, heritage walks and wildlife safaris — curated by trusted local agents and booked with confidence.",
  keywords: [
    "tour packages",
    "travel deals",
    "bangladesh tours",
    "beach vacations",
    "wildlife safaris",
    "heritage walks",
  ],
  openGraph: {
    title: "TripVerse — Explore the World, Book with Confidence",
    description:
      "Discover hand-picked tour packages — beaches, treks, heritage walks and wildlife safaris — curated by trusted local agents and booked with confidence.",
    type: "website",
  },
}

async function getFeatured(): Promise<TPublicPackage[]> {
  try {
    const res = await packagesApi.getList({ limit: 8, sortBy: "newest" })
    return res.data ?? []
  } catch {
    return []
  }
}

async function getTotalPackages(): Promise<number> {
  try {
    const res = await packagesApi.getList({ limit: 1 })
    return res.meta?.total ?? 0
  } catch {
    return 0
  }
}

async function getCategories() {
  try {
    return await packagesApi.getCategories()
  } catch {
    return []
  }
}

async function getBlogPosts() {
  try {
    const res = await blogApi.getList({ limit: 3, sortBy: "newest" })
    return res.data ?? []
  } catch {
    return []
  }
}

// Pulls up to 4 real review quotes from the featured packages for the
// testimonial carousel. Each call is guarded so one failing package can't
// break the section.
async function getTestimonials(
  featured: TPublicPackage[],
): Promise<Testimonial[]> {
  const sample = featured.slice(0, 4)
  const results = await Promise.allSettled(
    sample.map((pkg) => reviewsApi.getReviews(pkg.id, { limit: 8 })),
  )

  const testimonials: Testimonial[] = []
  for (const result of results) {
    if (result.status !== "fulfilled") continue
    for (const review of result.value.data ?? []) {
      if (!review.comment) continue
      testimonials.push({
        name: review.user.name,
        rating: review.rating,
        comment: review.comment,
      })
    }
  }

  // Spread reviews from the same package out so the carousel isn't dominated
  // by one trip, and cap at 5 slides.
  return testimonials.slice(0, 5)
}

export default async function HomePage() {
  const [featured, categories, posts, totalPackages] = await Promise.all([
    getFeatured(),
    getCategories(),
    getBlogPosts(),
    getTotalPackages(),
  ])

  const testimonials = await getTestimonials(featured)

  // Image per category from the first matching featured package, so category
  // tiles stay image-backed.
  const imagesBySlug: Record<string, string> = {}
  for (const pkg of featured) {
    if (!imagesBySlug[pkg.category?.slug]) {
      imagesBySlug[pkg.category.slug] = pkg.images?.[0] ?? ""
    }
  }

  const locations = Array.from(
    new Set(featured.map((pkg) => pkg.location).filter(Boolean)),
  ).slice(0, 12)

  const stats = {
    totalPackages: totalPackages,
    totalCategories: categories.length,
    totalDestinations: locations.length,
    avgRating: featured.length
      ? featured.reduce((sum, pkg) => sum + (pkg.rating ?? 0), 0) /
        featured.length
      : 0,
  }

  return (
    <>
      <HeroSection items={featured} />
      <CategoryGrid categories={categories} imagesBySlug={imagesBySlug} />
      {featured.length > 0 && (
        <FeaturedPackages packages={featured} />
      )}
      <DestinationMarquee locations={locations} />
      <HowItWorks />
      <StatsStrip stats={stats} />
      <TestimonialCarousel testimonials={testimonials} />
      <BlogTeaser posts={posts} />
      <FaqSection />
      <CtaBand />
    </>
  )
}