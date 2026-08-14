import { Skeleton } from "@/components/ui/skeleton"

export default function PackageDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-4 w-40" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <Skeleton className="aspect-[16/10] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
      <div className="mt-16">
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}