// Client-safe JWT payload decode (base64url → JSON). Does NOT verify the
// signature — that's proxy.ts / the backend's job. Used only to read the
// role for the post-login redirect target.
const decodeJwtPayload = (
  token: string,
): Record<string, unknown> | null => {
  try {
    const segment = token.split(".")[1]
    if (!segment) {
      return null
    }
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export { decodeJwtPayload }
