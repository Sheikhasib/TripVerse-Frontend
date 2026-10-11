import { REMOTE_IMAGE_HOSTS } from "@/lib/image-hosts"

export const PLACEHOLDER_IMAGE = "/placeholder.svg"

// next/image throws for remote hosts missing from images.remotePatterns, which
// would take down the whole page. Return the local placeholder for any URL
// whose host isn't allowed (or that can't be parsed).
export const safeImageSrc = (src: string | null | undefined): string => {
  if (!src) return PLACEHOLDER_IMAGE
  // Same-origin paths and local previews never hit remotePatterns.
  if ((src.startsWith("/") && !src.startsWith("//")) || /^(blob|data):/.test(src)) {
    return src
  }
  try {
    const url = new URL(src)
    const allowed =
      url.protocol === "https:" &&
      (REMOTE_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
    return allowed ? src : PLACEHOLDER_IMAGE
  } catch {
    return PLACEHOLDER_IMAGE
  }
}
