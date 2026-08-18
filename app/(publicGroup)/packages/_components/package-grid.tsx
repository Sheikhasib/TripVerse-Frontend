import { PackageCard } from "@/components/shared/package-card"
import { EmptyState } from "@/components/shared/empty-state"
import { RouteLoading } from "@/components/shared/route-loading"
import { Compass } from "@phosphor-icons/react/dist/ssr"
import type { TPublicPackage } from "@/lib/api/packages"

interface PackageGridProps {
  packages: TPublicPackage[]
  isLoading?: boolean
}

export function PackageGrid({ packages, isLoading }: PackageGridProps) {
  if (isLoading) {
    return <RouteLoading />
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