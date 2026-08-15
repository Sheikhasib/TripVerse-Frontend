"use client"

import { useState } from "react"
import { Plus, Minus } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/shared/section-heading"

const faqItems = [
  {
    question: "How do I book a tour package?",
    answer:
      "Browse packages, open the one you love, and hit Book Now. You'll pick your travel dates, review the total, and confirm — your agent then approves the booking and it shows up in your dashboard.",
  },
  {
    question: "Are the prices final?",
    answer:
      "Listed prices are set by the agent and shown upfront. The exact total (including any applicable fees) is previewed before you confirm, so there are no surprises at checkout.",
  },
  {
    question: "How do payments work?",
    answer:
      "Checkout is handled securely. You'll complete payment through a trusted gateway and receive a receipt — bookings are confirmed once payment is verified.",
  },
  {
    question: "What is the cancellation policy?",
    answer:
      "You can cancel a booking from your dashboard as long as it hasn't started. Depending on timing and status, cancellations may be refunded; contact support for specific cases.",
  },
  {
    question: "Can I review a package after my trip?",
    answer:
      "Yes. Once your trip is completed, you can rate the package and leave a review. These power the ratings you see across the site.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="FAQ"
        title="Frequently asked questions"
        subtitle="Everything you need to know before you go"
        align="center"
      />
      <div className="divide-y divide-border border-y border-border">
        {faqItems.map((faq, i) => {
          const open = openIndex === i
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-display text-base font-medium tracking-wide">
                  {faq.question}
                </span>
                {open ? (
                  <Minus className="shrink-0 text-primary" />
                ) : (
                  <Plus className="shrink-0 text-primary" />
                )}
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  open ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}