import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaBand() {
  return (
    <section className="bg-primary py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Your next adventure is one search away
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80 leading-relaxed">
          Join travellers and trusted agents on TripVerse. Explore curated
          packages, book with confidence, and share your story.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/packages">Browse Packages</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register?role=AGENT">Become an Agent</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}