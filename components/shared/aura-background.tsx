import { cn } from "@/lib/utils"

/**
 * Aura "Sunrise Drift" ambient background (MIT — github.com/CristianOlivera1/Aura).
 * Two blurred gradient layers blended over a theme-aware base, faithful to
 * Aura's own authoring: light = #faf8f2 with multiply blend, dark = #100e0b
 * with hard-light/soft-light blend. Purely decorative.
 */
interface AuraBackgroundProps {
  /** fixed = app-wide backdrop behind all content (default); absolute = fill a relative parent */
  absolute?: boolean
  className?: string
}

export function AuraBackground({ absolute = false, className }: AuraBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none isolate overflow-hidden",
        absolute ? "absolute inset-0" : "fixed inset-0 -z-10",
        "bg-[#faf8f2] dark:bg-[#100e0b]",
        className,
      )}
    >
      <div
        className="absolute inset-0 will-change-transform mix-blend-multiply blur-[75px] md:blur-[108px] dark:mix-blend-hard-light"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,138,255,0.1) 30%, rgb(255,255,255) 20%, rgb(247,164,66) 70%, rgb(233,66,247) 100%)",
          transform: "translateZ(0)",
        }}
      />
      <div
        className="absolute inset-0 will-change-transform mix-blend-multiply blur-[125px] md:blur-[180px] dark:mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,138,255,0.2) 35%, rgb(255,255,255) 70%, rgb(247,164,66) 80%, rgb(233,66,247) 100%)",
          transform: "translateZ(0)",
        }}
      />
    </div>
  )
}