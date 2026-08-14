import Link from "next/link"
import { Compass, House, MapPin, Path } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { GoBack } from "@/components/shared/go-back"

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.12) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-[170%] rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-1/2 h-80 w-80 translate-x-[150%] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative flex w-full max-w-xl flex-col items-center gap-9">
        <span className="grid size-14 animate-in zoom-in-0.5 fade-in-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 duration-500">
          <Compass className="size-7" weight="fill" />
        </span>

        <div className="space-y-2">
          <p className="animate-in fade-in-0 slide-in-from-bottom-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary duration-700 delay-100">
            404 · Route not found
          </p>
          <h1 className="animate-in fade-in-0 slide-in-from-bottom-3 bg-gradient-to-br from-primary via-cyan-600 to-accent bg-clip-text text-[5.5rem] font-black leading-none tracking-tighter text-transparent duration-700 delay-150 sm:text-[7.5rem]">
            404
          </h1>
        </div>

        <div className="relative w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-200">
          <svg
            className="w-full"
            viewBox="0 0 420 44"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 32 C 60 6, 120 40, 180 20 S 300 6, 356 22"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="7 9"
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle r="5" fill="hsl(var(--accent))">
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path="M12 32 C 60 6, 120 40, 180 20 S 300 6, 356 22"
              />
            </circle>
          </svg>
          <span className="absolute -top-3 right-0 flex -translate-y-full items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-semibold shadow-sm">
            <MapPin size={12} weight="fill" className="text-accent" />
            You are here
          </span>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            You&apos;ve wandered off the trail
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
            The page you&apos;re looking for was moved, renamed, or never
            existed. No worries — let&apos;s point you back toward the good
            stuff.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <GoBack href="/" variant="default" />
          <Button asChild variant="outline">
            <Link href="/packages">
              <Path size={15} />
              Browse packages
            </Link>
          </Button>
        </div>

        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <House
            size={14}
            className="transition-transform group-hover:-translate-y-0.5"
          />
          Return home
        </Link>
      </div>
    </main>
  )
}