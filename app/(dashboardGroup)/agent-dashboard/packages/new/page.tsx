import type { Metadata } from "next"
import { GoBack } from "@/components/shared/go-back"
import { PackageForm } from "@/components/dashboard/package-form"

export const metadata: Metadata = {
  title: "New Package",
}

export default function NewPackagePage() {
  return (
    <div className="space-y-6">
      <GoBack
        href="/agent-dashboard/my-packages"
        label="Back to My Packages"
      />
      <PackageForm mode="create" />
    </div>
  )
}