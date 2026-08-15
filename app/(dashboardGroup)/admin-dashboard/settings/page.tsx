import { ProfileForm } from "@/components/dashboard/profile-form"
import { GoBack } from "@/components/shared/go-back"

export const metadata = {
  title: "Settings",
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <GoBack href="/admin-dashboard" label="Back to overview" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile information.
        </p>
      </div>
      <div className="max-w-2xl rounded-lg bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
        <ProfileForm />
      </div>
    </div>
  )
}