import { apiClient } from "./client"
import type { TProfileSchema } from "@/lib/validations/public"
import type { TAuthUser } from "./auth"

const updateProfile = (payload: TProfileSchema) =>
  apiClient<TAuthUser>("/api/users/profile", {
    method: "PATCH",
    body: payload,
  })

export const usersApi = {
  updateProfile,
}