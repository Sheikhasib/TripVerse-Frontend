import type { NextConfig } from "next"
import { REMOTE_IMAGE_HOSTS } from "./lib/image-hosts"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async rewrites() {
    const backend = process.env.BACKEND_API_URL || "http://localhost:4000"
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
