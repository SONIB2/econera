"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui";
import { issueInvitation, type InvitationState } from "../actions";

const initial: InvitationState = { kind: "idle" };

export function InviteForm({ organization }: { organization: string }) {
  const [state, action, pending] = useActionState(issueInvitation, initial);
  return <form className="panel workspace-form" action={action}>
    <h2 className="row-title">Fto një anëtar</h2>
    <input type="hidden" name="organization" value={organization} />
    <Field label="Emaili i të ftuarit"><input required name="email" type="email" maxLength={254} autoComplete="off" /></Field>
    <p className="workspace-note">Ndaje kodin privatisht me personin e ftuar. Kodi skadon pas shtatë ditësh dhe mund të përdoret një herë.</p>
    <button className="button" disabled={pending}>{pending ? "Po krijohet ftesa…" : "Gjenero kodin"}</button>
    {state.kind === "invalid" && <p role="status">Kontrollo adresën e emailit.</p>}
    {state.kind === "failed" && <p role="status">Ftesa nuk u krijua.</p>}
    {state.kind === "issued" && <div className="stack">
      <p role="status">Kodi i ftesës u krijua.</p>
      <Field label="Kodi për ta ndarë"><input className="workspace-code" readOnly value={state.code} onFocus={(event) => event.currentTarget.select()} /></Field>
    </div>}
  </form>;
}
