import type { Metadata } from "next"
import { ContactForm } from "@/components/shared/contact-form"
import { EnvelopeSimple, Phone, MapPin } from "@phosphor-icons/react/dist/ssr"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the TripVerse team — questions, feedback, or support.",
}

const channels = [
  {
    icon: EnvelopeSimple,
    label: "Email",
    value: "support@tripverse.com",
    href: "mailto:support@tripverse.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+880 1926-312799",
    href: "tel:+8801926312799",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Dhaka, Bangladesh",
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary">
          Contact Us
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          We&apos;d love to hear from you
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Questions about a package, a booking, or just want to say hi? Drop us
          a message and we&apos;ll get back to you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        <div className="space-y-4 lg:col-span-2">
          {channels.map((channel) => (
            <div
              key={channel.label}
              className="flex items-center gap-4 rounded-lg bg-card p-5 ring-1 ring-foreground/5"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <channel.icon size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  {channel.label}
                </p>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {channel.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium">{channel.value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-lg bg-muted/40 p-5 text-sm text-muted-foreground leading-relaxed">
            Looking to list your tours on TripVerse?{" "}
            <a
              href="/register?role=AGENT"
              className="font-medium text-primary hover:underline"
            >
              Create an agent account
            </a>{" "}
            to start publishing packages.
          </div>
        </div>
      </div>
    </div>
  )
}