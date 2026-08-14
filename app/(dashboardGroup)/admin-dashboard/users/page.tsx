"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi, type TAdminUser, type TUserStatus } from "@/lib/api/users"
import { ApiError } from "@/lib/api/client"
import type { TRole } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { Users, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => usersApi.getAllUsers({ page, limit: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  })

  const totalPages = data?.meta?.totalPages ?? 1

  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users"] })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: TRole }) =>
      usersApi.changeRole(id, role),
    onSuccess: () => {
      toast.success("Role updated.")
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to update role."),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TUserStatus }) =>
      usersApi.changeStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated.")
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to update status."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted.")
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Failed to delete user."),
  })

  const users = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Manage Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all user accounts on the platform.
        </p>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No users found"
          description="Users will appear here once accounts are created."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card ring-1 ring-foreground/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: TAdminUser) => (
                <tr
                  key={user.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        roleMutation.mutate({
                          id: user.id,
                          role: e.target.value as TRole,
                        })
                      }
                      disabled={roleMutation.isPending}
                      className="cursor-pointer rounded border border-border bg-background px-2 py-1 text-sm"
                    >
                      <option value="USER">USER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          statusMutation.mutate({
                            id: user.id,
                            status:
                              user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                          })
                        }
                        disabled={statusMutation.isPending}
                      >
                        {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}