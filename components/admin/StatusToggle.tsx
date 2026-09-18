"use client";

import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/cn";

/**
 * Active/inactive switch for table rows. Flips immediately, then calls the
 * server action; if that fails the switch falls back and shows an error.
 */
export function StatusToggle({
  id,
  active,
  label,
  action,
}: {
  id: string;
  active: boolean;
  /** Item name, for the accessible label. */
  label: string;
  action: (id: string, isActive: boolean) => Promise<void>;
}) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const next = !optimistic;
    setFailed(false);
    startTransition(async () => {
      setOptimistic(next);
      try {
        await action(id, next);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label={`${label} active`}
        onClick={toggle}
        disabled={pending}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait",
          optimistic ? "bg-ink" : "bg-line",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-paper shadow transition-transform",
            optimistic ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
      <span className={cn("text-xs", failed ? "text-red-700" : optimistic ? "text-ink" : "text-muted")}>
        {failed ? "Failed — retry" : optimistic ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
