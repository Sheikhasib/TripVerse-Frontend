import { Link } from "react-transition-progress/next"
import Image from "next/image"
import { ArrowRight, CalendarBlank, Compass } from "@phosphor-icons/react/dist/ssr"
import type { TBlogPostListItem } from "@/lib/api/blog"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))

interface BlogCardProps {
  post: TBlogPostListItem
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group/card flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5 transition-all duration-300 hover:ring-primary/30 hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-all duration-500 group-hover/card:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Compass size={48} className="text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarBlank size={13} />
          {formatDate(post.createdAt)}
        </span>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="line-clamp-2 font-display text-lg font-medium tracking-wide transition-colors hover:text-primary">
            {post.title}
          </h3>
        </Link>
        <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs font-medium text-muted-foreground">
            by {post.author.name}
          </span>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
          >
            Read <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  )
}