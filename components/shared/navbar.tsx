"use client"

import { useState } from "react"
import { Link } from "react-transition-progress/next"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Compass,
  Gauge,
  List,
  Moon,
  SignIn,
  SignOut,
  Sun,
  User,
  UserPlus,
  X,
} from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { authApi } from "@/lib/api/auth"
import { roleDashboard } from "@/utils/role"
import { useMe } from "@/hooks/use-me"
import type { TRole } from "@/lib/validations/auth"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Packages", href: "/packages" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const roleLabel: Record<TRole, string> = {
  USER: "User Dashboard",
  AGENT: "Agent Dashboard",
  ADMIN: "Admin Dashboard",
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useMe()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoggedIn = Boolean(user)

  const handleLogout = async () => {
    try {
      await authApi.logout()
      toast.success("Logged out successfully")
    } catch {
      toast.error("Failed to log out. Please try again.")
    }
    setMobileOpen(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Compass className="size-5" weight="fill" />
          </span>
          TripVerse
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          </Button>

          <div className="hidden md:block">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="size-8">
                      {user!.avatarUrl ? (
                        <AvatarImage
                          src={user!.avatarUrl}
                          alt={user!.name || "Avatar"}
                        />
                      ) : (
                        <AvatarFallback className="text-xs text-primary">
                          {getInitials(user!.name || "N/A")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="sr-only">Open user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{user!.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {user!.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="gap-2">
                      <Link href="/profile">
                        <User />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="gap-2">
                      <Link href={roleDashboard(user!.role)}>
                        <Gauge />
                        {roleLabel[user!.role]}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      className="gap-2"
                      onSelect={handleLogout}
                    >
                      <SignOut />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login">
                    <SignIn className="mr-1" />
                    Log In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <UserPlus className="mr-1" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <List />
          </Button>
        </div>
      </nav>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-72 bg-background p-0 sm:max-w-xs"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation menu
          </SheetDescription>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Compass className="size-4" weight="fill" />
                </span>
                TripVerse
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:text-primary",
                        pathname === item.href
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                {isLoggedIn && (
                  <li>
                    <Link
                      href={roleDashboard(user!.role)}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Gauge />
                      {roleLabel[user!.role]}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className="border-t border-border p-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-9">
                    {user!.avatarUrl ? (
                      <AvatarImage
                        src={user!.avatarUrl}
                        alt={user!.name || "Avatar"}
                      />
                    ) : (
                      <AvatarFallback className="text-xs text-primary">
                        {getInitials(user!.name || "N/A")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium">
                      {user!.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user!.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleLogout}
                    aria-label="Log out"
                  >
                    <SignOut />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/login">
                      <SignIn className="mr-1" />
                      Log In
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/register">
                      <UserPlus className="mr-1" />
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}