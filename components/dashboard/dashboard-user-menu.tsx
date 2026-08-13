"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  ArrowLeft,
  Gauge,
  SignOut,
  User,
} from "@phosphor-icons/react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-me"
import { authApi } from "@/lib/api/auth"

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()

const roleLabel = (role: string) => {
  switch (role) {
    case "AGENT":
      return "Agent"
    case "ADMIN":
      return "Admin"
    default:
      return "User"
  }
}

export function DashboardUserMenu() {
  const router = useRouter()
  const { user, isLoading } = useMe()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      toast.success("Logged out successfully")
    } catch {
      toast.error("Failed to log out. Please try again.")
    }
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" asChild>
        <Link href="/">
          <ArrowLeft className="mr-1" />
          View Site
        </Link>
      </Button>

      {isLoading || !user ? (
        <Skeleton className="size-9 rounded-full" />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name || "Avatar"} />
                ) : (
                  <AvatarFallback className="text-xs text-primary">
                    {getInitials(user.name || "N/A")}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="sr-only">Open dashboard menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                  <span
                    className={cn(
                      "mt-1 w-fit rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
                      user.role === "ADMIN"
                        ? "border-primary/30 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {roleLabel(user.role)}
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
                <Link href="/">
                  <Gauge />
                  Public Site
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
      )}
    </div>
  )
}