import { PackageCard } from "@/components/shared/package-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Compass } from "@phosphor-icons/react/dist/ssr"
import type { TPublicPackage } from "@/lib/api/packages"

interface PackageGridProps {
  packages: TPublicPackage[]
  isLoading?: boolean
}

export function PackageGrid({ packages, isLoading }: PackageGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg ring-1 ring-foreground/5">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <EmptyState
        icon={<Compass size={40} />}
        title="No packages found"
        description="Try adjusting your filters or search terms — or check back soon for new trips."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} rating={pkg.rating} />
      ))}
    </div>
  )
}