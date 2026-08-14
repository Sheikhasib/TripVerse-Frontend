import { apiClient, apiClientFull } from "./client"
import type { TProfileSchema } from "@/lib/validations/public"
import type { TAuthUser } from "./auth"
import type { TRole } from "@/lib/validations/auth"

export type TUserStatus = "ACTIVE" | "SUSPENDED"

export type TAdminUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  role: TRole
  status: TUserStatus
  createdAt: string
}

export type TAdminUserQuery = {
  page?: number
  limit?: number
  search?: string
  role?: TRole
  status?: TUserStatus
}

const buildQuery = (params: TAdminUserQuery = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (params.search) query.set("search", params.search)
  if (params.role) query.set("role", params.role)
  if (params.status) query.set("status", params.status)
  return query.toString()
}

const updateProfile = (payload: TProfileSchema) =>
  apiClient<TAuthUser>("/api/users/profile", {
    method: "PATCH",
    body: payload,
  })

const getAllUsers = async (params: TAdminUserQuery = {}) => {
  const qs = buildQuery(params)
  const envelope = await apiClientFull<TAdminUser[]>(
    `/api/users${qs ? `?${qs}` : ""}`,
  )
  return { data: envelope.data, meta: envelope.meta }
}

const changeRole = (id: string, role: TRole) =>
  apiClient<TAdminUser>(`/api/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  })

const changeStatus = (id: string, status: TUserStatus) =>
  apiClient<TAdminUser>(`/api/users/${id}/status`, {
    method: "PATCH",
    body: { status },
  })

const deleteUser = (id: string) =>
  apiClient<TAdminUser>(`/api/users/${id}`, { method: "DELETE" })

export const usersApi = {
  updateProfile,
  getAllUsers,
  changeRole,
  changeStatus,
  deleteUser,
}