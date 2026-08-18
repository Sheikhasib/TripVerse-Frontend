"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  X,
  PencilLine,
  Package,
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { packagesApi, type TPackageStatus } from "@/lib/api/packages"
import { ApiError } from "@/lib/api/client"
import { formatBDT } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { RouteLoading } from "@/components/shared/route-loading"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Pagination } from "@/components/shared/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 10

const FILTERS: { value: TPackageStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

const formatPrice = (price: number) => formatBDT(Number(price))

export default function AdminPackagesPage() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<TPackageStatus | "ALL">(
    (searchParams.get("status") as TPackageStatus | null) ?? "ALL",
  )
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-packages", status, page],
    queryFn: () =>
      packagesApi.getAllPackages(
        status === "ALL"
          ? { page, limit: PAGE_SIZE }
          : { status, page, limit: PAGE_SIZE },
      ),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const totalPages = data?.meta?.totalPages ?? 1
  const packages = data?.data ?? []
  const safePage = Math.min(page, totalPages)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-packages"] })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      next,
    }: {
      id: string
      next: "APPROVED" | "REJECTED"
    }) => packagesApi.changePackageStatus(id, next),
    onSuccess: () => {
      invalidate()
      toast.success("Package status updated.")
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Manage packages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review agent submissions and approve or reject them for the public
          catalog.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatus(filter.value)
              setPage(1)
            }}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              status === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <RouteLoading className="min-h-60" />
      ) : packages.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No packages found"
          description={
            status === "ALL"
              ? "Agents haven't created any packages yet."
              : `No ${status.toLowerCase()} packages right now.`
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {pkg.images?.[0] && (
                        <Image
                          src={pkg.images[0]}
                          alt={pkg.title}
                          width={48}
                          height={36}
                          className="h-9 w-12 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-medium">
                          {pkg.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pkg.category?.name} · {pkg.location}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pkg.agent?.name ?? "Unknown agent"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatPrice(Number(pkg.price))}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pkg.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {pkg.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: pkg.id, next: "APPROVED" })
                            }
                          >
                            <Check />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: pkg.id, next: "REJECTED" })
                            }
                          >
                            <X />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin-dashboard/packages/${pkg.id}/edit`}>
                          <PencilLine />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {packages.length > 0 && (
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  )
}