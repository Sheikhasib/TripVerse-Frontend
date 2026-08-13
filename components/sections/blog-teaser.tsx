import { SectionHeading } from "@/components/shared/section-heading"
import { BlogCard } from "@/components/shared/blog-card"
import type { TBlogPostListItem } from "@/lib/api/blog"

interface BlogTeaserProps {
  posts: TBlogPostListItem[]
}

export function BlogTeaser({ posts }: BlogTeaserProps) {
  if (posts.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="From the Blog"
        title="Travel stories & tips"
        subtitle="Guides written by our agents and admins"
        href="/blog"
        linkLabel="View All Posts"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}