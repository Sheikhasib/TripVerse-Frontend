"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const useCountdown = (initialSeconds: number) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(
    (seconds = initialSeconds) => {
      stop()
      setSecondsLeft(seconds)
      intervalRef.current = setInterval(() => {
        setSecondsLeft((current) => (current <= 1 ? 0 : current - 1))
      }, 1000)
    },
    [initialSeconds, stop],
  )

  useEffect(() => {
    if (secondsLeft <= 0) stop()
  }, [secondsLeft, stop])

  useEffect(() => stop, [stop])

  return { secondsLeft, start }
}

export { useCountdown }
