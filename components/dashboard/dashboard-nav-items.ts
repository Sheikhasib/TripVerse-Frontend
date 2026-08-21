import type { Icon } from "@phosphor-icons/react"
import {
  ChartLineUp,
  Compass,
  CreditCard,
  Gauge,
  GearSix,
  Heart,
  Newspaper,
  Package,
  Plus,
  Receipt,
  Users,
} from "@phosphor-icons/react"
import type { TRole } from "@/lib/validations/auth"

export type NavItem = { label: string; href: string; icon: Icon }

export type NavSection = { title: string; items: NavItem[] }

export const NAV_SECTIONS_BY_ROLE: Record<TRole, NavSection[]> = {
  USER: [
    {
      title: "Overview",
      items: [
        { label: "Overview", href: "/user-dashboard", icon: Gauge },
        { label: "Browse Trips", href: "/packages", icon: Compass },
      ],
    },
    {
      title: "Trips",
      items: [
        { label: "Wishlist", href: "/user-dashboard/wishlist", icon: Heart },
        { label: "My Bookings", href: "/user-dashboard/bookings", icon: Receipt },
        { label: "Payments", href: "/user-dashboard/payments", icon: CreditCard },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Profile", href: "/user-dashboard/profile", icon: Users },
        { label: "Settings", href: "/user-dashboard/settings", icon: GearSix },
      ],
    },
  ],
  AGENT: [
    {
      title: "Overview",
      items: [
        { label: "Manager", href: "/agent-dashboard", icon: Gauge },
      ],
    },
    {
      title: "Content",
      items: [
        { label: "My Packages", href: "/agent-dashboard/my-packages", icon: Package },
        { label: "New Package", href: "/agent-dashboard/packages/new", icon: Plus },
        { label: "My Posts", href: "/agent-dashboard/my-posts", icon: Newspaper },
      ],
    },
    {
      title: "Sales",
      items: [
        { label: "Bookings", href: "/agent-dashboard/bookings", icon: Receipt },
      ],
    },
  ],
  ADMIN: [
    {
      title: "Overview",
      items: [
        { label: "Overview", href: "/admin-dashboard", icon: Gauge },
      ],
    },
    {
      title: "Content",
      items: [
        { label: "Packages", href: "/admin-dashboard/packages", icon: Package },
        { label: "Posts", href: "/admin-dashboard/posts", icon: Newspaper },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Users", href: "/admin-dashboard/users", icon: Users },
        { label: "Bookings", href: "/admin-dashboard/bookings", icon: Receipt },
        { label: "Analytics", href: "/admin-dashboard/analytics", icon: ChartLineUp },
        { label: "Settings", href: "/admin-dashboard/settings", icon: GearSix },
      ],
    },
  ],
}

export const roleDisplayName = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "AGENT":
      return "Agent"
    default:
      return "Traveler"
  }
}