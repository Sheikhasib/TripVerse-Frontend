import { Link } from "react-transition-progress/next"
import {
  Compass,
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  Phone,
  XLogo,
} from "@phosphor-icons/react/dist/ssr"

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Packages", href: "/packages" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "Get Started",
    links: [
      { label: "Become an Agent", href: "/register?role=AGENT" },
      { label: "Sign In", href: "/login" },
    ],
  },
]

const socials = [
  { label: "Facebook", href: "https://facebook.com", icon: FacebookLogo },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramLogo },
  { label: "X", href: "https://x.com", icon: XLogo },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <Compass className="size-4" weight="fill" />
              </span>
              TripVerse
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Discover curated tour packages from trusted local agents. Explore
              the world with confidence.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a
              href="mailto:support@tripverse.com"
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <EnvelopeSimple size={16} />
              support@tripverse.com
            </a>
            <span className="inline-flex items-center gap-2">
              <Phone size={16} />
              +880 1926-312799
            </span>
          </div>
          <div className="flex items-center gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex size-9 items-center justify-center text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:text-primary hover:ring-primary/30"
              >
                <social.icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>&copy; {year} TripVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}