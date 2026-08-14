import { apiClient } from "./client"
import type { TPayment, TPaymentStatus } from "./bookings"

export type { TPayment, TPaymentStatus }

export type TPaymentCreateResult = {
  paymentId: string
  tranId: string
  paymentUrl: string
}

export const paymentsApi = {
  createPayment: (payload: { bookingId: string }) =>
    apiClient<TPaymentCreateResult>("/api/payments/create", {
      method: "POST",
      body: payload,
    }),
}