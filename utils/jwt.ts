import jwt, { JwtPayload, SignOptions } from "jsonwebtoken"

// Mirrors tripverse-server/src/utils/jwt.ts — used only in proxy.ts (Step 4)
// and service/refreshToken.ts. Never import this in client components.
const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions,
) => {
  return jwt.sign(payload, secret, expiresIn)
}

const verifyToken = (token: string, secret: string) => {
  try {
    const data = jwt.verify(token, secret) as JwtPayload
    return { success: true as const, data }
  } catch (error) {
    return {
      success: false as const,
      error: (error as Error).message,
    }
  }
}

export const jwtUtils = { createToken, verifyToken }
