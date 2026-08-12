import Link from "next/link"
import { Compass, House } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Compass className="size-7" weight="fill" />
      </span>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          The page you are looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <House className="size-4" />
          Back to home
        </Link>
      </Button>
    </main>
  )
}
