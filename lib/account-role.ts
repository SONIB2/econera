export type AccountRole = "furnitor" | "bleres";

/** Where each account type lands after signing in: suppliers manage stock, buyers search the market. */
export function homeFor(metadata: Record<string, unknown> | undefined) {
  return metadata?.role === "bleres" ? "/treg" : "/paneli";
}

export const ROLES: { id: AccountRole; title: string; text: string }[] = [
  { id: "bleres", title: "Jam blerës", text: "Kontraktor, firmë ose individ. Kërkoj materiale. Falas." },
  { id: "furnitor", title: "Jam furnitor", text: "Depo, prodhues ose kompani ndërtimi me stok të tepërt." },
];
