import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeading } from "@/components/shared/section-heading"
import { FaqSection } from "@/components/sections/faq"

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Answers to common questions about booking, payments, cancellations, and reviews on TripVerse.",
}

const helpTopics = [
  {
    title: "Searching & booking",
    items: [
      "Browse packages and filter by destination, budget, and duration.",
      "Open a package and hit Book Now to reserve your dates.",
      "Your agent approves the booking — track it from your dashboard.",
    ],
  },
  {
    title: "Payments",
    items: [
      "Total cost is previewed before you confirm — no hidden fees.",
      "Payments go through a secure gateway and you receive a receipt.",
      "Booking is confirmed once payment is verified.",
    ],
  },
  {
    title: "Cancellations",
    items: [
      "Cancel any booking that hasn't started yet from your dashboard.",
      "Refunds depend on timing and status — contact support for specifics.",
    ],
  },
  {
    title: "Reviews",
    items: [
      "Review a package only after you've completed the trip.",
      "One review per package per traveller — it powers the star ratings.",
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Help Center"
        title="How can we help?"
        subtitle="Quick answers to the questions travellers ask us most"
        align="center"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {helpTopics.map((topic) => (
          <div
            key={topic.title}
            className="rounded-lg bg-card p-6 ring-1 ring-foreground/5"
          >
            <h2 className="text-lg font-semibold tracking-wide">{topic.title}</h2>
            <ul className="mt-4 space-y-2">
              {topic.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <FaqSection />
      </div>

      <div className="mt-14 flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Still stuck? Our team is happy to help.
        </p>
        <Link
          href="/contact"
          className="text-sm font-medium text-primary hover:underline"
        >
          Contact support &rarr;
        </Link>
      </div>
    </div>
  )
}