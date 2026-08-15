import { AccountSettingsForm } from "@/components/dashboard/account-settings-form"
import { GoBack } from "@/components/shared/go-back"

export const metadata = {
  title: "Settings",
}

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <GoBack href="/user-dashboard" label="Back to overview" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>
      <AccountSettingsForm />
    </div>
  )
}