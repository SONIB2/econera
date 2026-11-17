"use client";

import { useActionState } from "react";
import { adminLogin, type LoginState } from "@/app/(site)/actions";

export function AdminLogin() {
  const [state, action, pending] = useActionState<LoginState, FormData>(adminLogin, {});
  return (
    <form action={action} className="card mx-auto grid max-w-sm gap-4 p-8">
      <p className="eyebrow">Admin</p>
      <h1 className="display text-3xl">Hyr.</h1>
      <label className="grid gap-1.5 text-sm">Fjalëkalimi
        <input type="password" name="password" required autoComplete="current-password" className="h-12 rounded-xl border border-line bg-bg-2 px-4 text-ink focus:border-lime focus:outline-none" />
      </label>
      {state.error && <p role="alert" className="text-sm text-lime">{state.error}</p>}
      <button className="btn-primary h-12" disabled={pending}>{pending ? "Duke hyrë…" : "Hyr"}</button>
    </form>
  );
}
