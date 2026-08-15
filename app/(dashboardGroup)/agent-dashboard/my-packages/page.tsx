"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Spinner, Trash, PencilLine } from "@phosphor-icons/react"
import { toast } from "sonner"
import { packagesApi } from "@/lib/api/packages"
import { ApiError } from "@/lib/api/client"
import { formatBDT } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TInternalPackage } from "@/lib/api/packages"

const formatPrice = (price: number) => formatBDT(Number(price))

const PAGE_SIZE = 10

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value))
    : "—"

export default function MyPackagesPage() {
  const queryClient = useQueryClient()
  const [toDelete, setToDelete] = useState<TInternalPackage | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["my-packages", page],
    queryFn: () => packagesApi.getMyPackages({ page, limit: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packagesApi.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-packages"] })
      toast.success("Package deleted.")
      setToDelete(null)
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Something went wrong.",
      )
    },
  })

  const packages = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My packages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the tours you offer. New and edited packages need approval
            before they go live.
          </p>
        </div>
        <Button asChild>
          <Link href="/agent-dashboard/packages/new">
            <Plus />
            New Package
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="mb-3 h-14 rounded-md last:mb-0" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={<PencilLine size={40} />}
          title="No packages yet"
          description="Create your first tour package and it will appear here once an admin approves it."
          action={
            <Button asChild>
              <Link href="/agent-dashboard/packages/new">
                <Plus />
                Create a package
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
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
                          {pkg.location}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pkg.category?.name}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatPrice(Number(pkg.price))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pkg.duration}d
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pkg.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(pkg.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/agent-dashboard/packages/${pkg.id}/edit`}>
                          <PencilLine />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setToDelete(pkg)}
                      >
                        <Trash />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onPageChange={setPage}
      />

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete package?</DialogTitle>
            <DialogDescription>
              &ldquo;{toDelete?.title}&rdquo; will be removed from the site. This
              action can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
            >
              {deleteMutation.isPending ? (
                <Spinner className="size-4 animate-spin" />
              ) : (
                <Trash />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}