import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarBlank } from "@phosphor-icons/react/dist/ssr"
import { SectionHeading } from "@/components/shared/section-heading"
import { BlogCard } from "@/components/shared/blog-card"
import type { TBlogPostListItem } from "@/lib/api/blog"

interface BlogTeaserProps {
  posts: TBlogPostListItem[]
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))

export function BlogTeaser({ posts }: BlogTeaserProps) {
  if (posts.length === 0) return null

  const [feature, ...rest] = posts

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="From the Blog"
        title="Travel stories & tips"
        subtitle="Guides written by our agents and admins"
        href="/blog"
        linkLabel="View All Posts"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {feature && (
          <Link
            href={`/blog/${feature.slug}`}
            className="group relative col-span-1 flex min-h-96 flex-col justify-end overflow-hidden rounded-lg ring-1 ring-foreground/5 transition-all duration-300 hover:ring-primary/30 hover:shadow-lg lg:col-span-2"
          >
            {feature.coverImage ? (
              <Image
                src={feature.coverImage}
                alt={feature.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-all duration-700 group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-white/70">
                <CalendarBlank size={13} />
                {formatDate(feature.createdAt)}
              </span>
              <h3 className="mt-2 max-w-xl font-display text-2xl leading-snug font-medium text-white sm:text-3xl">
                {feature.title}
              </h3>
              <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/80">
                {feature.excerpt}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white uppercase">
                Read the story
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        )}
        <div className="flex flex-col gap-6">
          {rest.slice(0, 2).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}