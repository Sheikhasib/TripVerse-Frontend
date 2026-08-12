import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/app/providers/query-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"
import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "TripVerse — Explore the World, Book with Confidence",
    template: "%s · TripVerse",
  },
  description:
    "TripVerse is a travel marketplace to discover and book tour packages from trusted local agents.",
  applicationName: "TripVerse",
  keywords: ["travel", "tour packages", "trip booking", "TripVerse"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  themeColor: "#0e9f6e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", geistSans.variable, "font-sans", geistMono.variable)}
    >
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
