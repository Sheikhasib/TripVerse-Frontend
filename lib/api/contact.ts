import { apiClient } from "./client"
import type { TContactSchema } from "@/lib/validations/public"

const send = (payload: TContactSchema) =>
  apiClient<null>("/api/contact", {
    method: "POST",
    body: payload,
  })

export const contactApi = {
  send,
}