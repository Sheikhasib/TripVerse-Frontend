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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-center gap-3 p-8 text-center ring-1 ring-foreground/5 bg-card rounded-lg"
            >
              <div className="flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
                <step.icon size={28} />
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Step {i + 1}
              </span>
              <h3 className="text-lg font-semibold tracking-wide">{step.title}</h3>
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