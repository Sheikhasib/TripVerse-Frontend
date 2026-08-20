// Parses the ?sentAt= epoch param used by the OTP flows. Returns undefined for
// missing/invalid values so callers fall back to the default 60s countdown.
const parseSentAt = (raw: string | null | undefined): number | undefined => {
  if (!raw) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

// Module-level Date.now wrapper — react-hooks/purity flags Date.now called
// inside a component, so callers use this opaque helper at event time.
const sentAtNow = () => Date.now()

export { parseSentAt, sentAtNow }