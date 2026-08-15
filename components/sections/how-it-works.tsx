import { MagnifyingGlass, CalendarCheck, MapTrifold } from "@phosphor-icons/react/dist/ssr"
import { SectionHeading } from "@/components/shared/section-heading"

const steps = [
  {
    icon: MagnifyingGlass,
    title: "Discover",
    text: "Browse curated tour packages and filter by destination, budget, and duration to find your perfect escape.",
  },
  {
    icon: CalendarCheck,
    title: "Book & confirm",
    text: "Reserve your dates in a few clicks. Your agent confirms the booking and you track it from your dashboard.",
  },
  {
    icon: MapTrifold,
    title: "Travel & review",
    text: "Set off on your trip, then share your experience with a rating and review to help fellow travellers.",
  },
]

// Editorial numbered band — each step gets a large ghost numeral behind it,
// serif titles, and a connective line across the three columns.
export function HowItWorks() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title="Booking is as easy as 1-2-3"
          subtitle="From browsing to exploring in three simple steps"
          align="center"
        />
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute top-12 right-[16%] left-[16%] hidden h-px bg-border md:block" />
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center gap-3 rounded-lg bg-card p-8 text-center ring-1 ring-foreground/5"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-3 right-5 font-display text-6xl font-medium text-foreground/[0.06]"
              >
                {i + 1}
              </span>
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                <step.icon size={26} />
              </div>
              <h3 className="mt-1 font-display text-xl font-medium tracking-wide">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}