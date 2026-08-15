import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Compass } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"

export function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-primary py-24">
      <Image
        src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-15"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center sm:px-6">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/20">
          <Compass size={26} />
        </span>
        <h2 className="mt-6 font-display text-4xl font-medium tracking-tight text-primary-foreground sm:text-5xl">
          Your next adventure is one search away
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 leading-relaxed">
          Join travellers and trusted agents on TripVerse. Explore curated
          packages, book with confidence, and share your story.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/packages">
              Browse Packages
              <ArrowRight />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            asChild
          >
            <Link href="/register?role=AGENT">Become an Agent</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}