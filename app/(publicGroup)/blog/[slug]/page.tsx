import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { blogApi } from "@/lib/api/blog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GoBack } from "@/components/shared/go-back"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string) {
  try {
    return await blogApi.getBySlug(slug)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) {
    return { title: "Post not found" }
  }
  return {
    title: post.title,
    description: post.excerpt,
  }
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value))

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <GoBack href="/blog" label="Back to blog" className="mb-8" />

      <header className="space-y-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">
          {formatDate(post.createdAt)}
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {post.author.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            ) : (
              <AvatarFallback className="text-xs text-primary">
                {getInitials(post.author.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-sm font-medium">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">TripVerse Writer</p>
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <p className="mt-8 text-lg font-medium leading-relaxed text-foreground/90">
        {post.excerpt}
      </p>

      <div className="mt-6 space-y-4 border-t border-border pt-8">
        {post.content.split(/\n\n+/).map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}