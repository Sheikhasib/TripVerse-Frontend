import type { Metadata } from "next"
import { SectionHeading } from "@/components/shared/section-heading"
import { CtaBand } from "@/components/sections/cta-band"
import {
  Compass,
  UsersThree,
  ShieldCheck,
  MapTrifold,
} from "@phosphor-icons/react/dist/ssr"

export const metadata: Metadata = {
  title: "About",
  description:
    "TripVerse is a travel marketplace connecting travellers with trusted local agents for curated tour packages across Bangladesh.",
}

const values = [
  {
    icon: ShieldCheck,
    title: "Trusted agents",
    text: "Every package is created by a verified agent and approved by our team before it goes live — so you book with confidence.",
  },
  {
    icon: MapTrifold,
    title: "Curated destinations",
    text: "From the Sundarbans to St. Martin's Island, we hand-pick trips that showcase the best of what Bangladesh has to offer.",
  },
  {
    icon: UsersThree,
    title: "Real reviews",
    text: "Ratings and reviews come only from travellers who completed the trip, keeping our marketplace honest and transparent.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="About TripVerse"
        title="Travel, made simple and trusted"
        subtitle="We connect curious travellers with verified local agents"
        align="center"
      />

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          TripVerse started with a simple idea: booking a tour shouldn&apos;t be
          a leap of faith. Too many travellers scroll through vague listings,
          worry about hidden costs, and gamble on unverified operators. We
          built TripVerse to change that.
        </p>
        <p>
          Every package on our platform is created by a registered agent,
          reviewed by our team, and only published once it meets our quality
          bar. Prices are shown upfront, bookings are tracked from your
          dashboard, and reviews are written only by travellers who actually
          completed the trip.
        </p>
        <p>
          Whether you&apos;re chasing the cloud sea at Bandarban, exploring
          Old Dhaka&apos;s food lanes, or cruising the mangroves of the
          Sundarbans — TripVerse makes it one search away.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {values.map((value) => (
          <div
            key={value.title}
            className="flex flex-col items-center gap-3 rounded-lg bg-card p-8 text-center ring-1 ring-foreground/5"
          >
            <div className="flex size-14 items-center justify-center rounded-md bg-primary/10 text-primary">
              <value.icon size={28} />
            </div>
            <h3 className="text-lg font-semibold tracking-wide">{value.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {value.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-14 flex items-center justify-center gap-3 rounded-lg bg-muted/40 p-8 text-center">
        <Compass size={20} className="shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Have a story to share or feedback for us?{" "}
          <a href="/contact" className="font-medium text-primary hover:underline">
            Get in touch
          </a>
          .
        </p>
      </div>

      <div className="mt-20">
        <CtaBand />
      </div>
    </div>
  )
}