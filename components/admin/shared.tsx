"use client";
import { ApiError } from "@/lib/api/client";
import { AlertCircle, LoaderCircle } from "lucide-react";
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`status-badge status-${status.toLowerCase().replaceAll("_", "-")}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
export function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="form-alert" role="alert">
      <AlertCircle size={19} />
      <span>
        {error instanceof ApiError && error.status === 403
          ? "You don’t have permission to perform this action."
          : error instanceof Error
            ? error.message
            : "The request failed."}
      </span>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}
export function SaveButton({
  pending,
  label = "Save changes",
}: {
  pending: boolean;
  label?: string;
}) {
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending ? (
        <>
          <LoaderCircle className="spin" size={16} />
          Saving…
        </>
      ) : (
        label
      )}
    </button>
  );
}
