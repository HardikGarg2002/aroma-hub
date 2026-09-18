"use client";

import { useActionState } from "react";
import { login } from "@/lib/admin/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Username" name="username" autoComplete="username" defaultValue={state?.username} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />

      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bone transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        required
        {...props}
        className="mt-1.5 block w-full rounded-md border border-line bg-bone/40 px-3 py-2 text-sm outline-none transition-colors focus:border-ink"
      />
    </label>
  );
}
