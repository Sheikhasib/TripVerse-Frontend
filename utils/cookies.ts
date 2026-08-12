const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") {
    return undefined
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  )

  return match ? decodeURIComponent(match[1]) : undefined
}

const setCookie = (name: string, value: string, days = 1) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export const cookieUtils = { getCookie, setCookie, deleteCookie }
