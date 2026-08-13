import type { Metadata } from "next"
import { SectionHeading } from "@/components/shared/section-heading"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TripVerse collects, uses, and protects your personal information.",
}

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account details: your name, email address, phone number, and password when you register.",
      "Booking data: the packages you book, travel dates, and payment records.",
      "Usage data: how you interact with the platform, such as pages visited and searches performed.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "To operate your account and process your bookings.",
      "To communicate about your bookings, payments, and account activity.",
      "To improve our marketplace and keep it safe for all users.",
    ],
  },
  {
    title: "Sharing your information",
    body: [
      "Agents see the details they need to fulfil your booking.",
      "Payment processors handle transactions securely on our behalf.",
      "We never sell your personal information to third parties.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can update your profile details at any time from your account.",
      "You can request deletion of your account by contacting support.",
      "You may opt out of non-essential communications.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use industry-standard safeguards to protect your data.",
      "Passwords are stored hashed, and payment handling is PCI-compliant via our processors.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Privacy Policy"
        title="Your privacy matters"
        subtitle="Last updated: August 2026"
        align="center"
      />

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <ul className="mt-4 space-y-2">
              {section.body.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}