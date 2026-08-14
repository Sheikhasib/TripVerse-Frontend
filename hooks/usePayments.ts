"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/lib/api/payments"
import { ApiError } from "@/lib/api/client"

export const useCreatePayment = () =>
  useMutation({
    mutationFn: paymentsApi.createPayment,
    onSuccess: (data) => {
      window.location.assign(data.paymentUrl)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })