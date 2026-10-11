// Hosts next/image may load from. Single source of truth for
// `images.remotePatterns` in next.config.ts and for safeImageSrc.
export const REMOTE_IMAGE_HOSTS = [
  "res.cloudinary.com",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
] as const
