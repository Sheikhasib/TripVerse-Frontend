import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry: () => void;
}

export function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : "We couldn't load this right now.";

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-6 py-16 text-center"
    >
      <WarningCircle size={40} className="text-destructive" />
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
