import type { Metadata } from "next"
import { PackageForm } from "@/components/dashboard/package-form"

export const metadata: Metadata = {
  title: "New Package",
}

export default function NewPackagePage() {
  return <PackageForm mode="create" />
}