/**
 * "Projektet e mia": projects saved in this browser. Signed-in sync to Supabase uses the
 * `tool_projects` table (supabase/migrations/202611250007_tool_projects.sql) once it is applied.
 */
export type ProjectKind = "renovim" | "shporta" | "smartcut";
export type Project<T = unknown> = { id: string; kind: ProjectKind; title: string; createdAt: string; updatedAt: string; data: T };

const KEY = "econera.projects.v1";
const HANDOFF = "econera.handoff.v1";

function read(): Project[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Project[]; } catch { return []; }
}
function write(list: Project[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); window.dispatchEvent(new Event("econera-projects")); } catch { /* storage unavailable */ }
}

export const projects = {
  list: (): Project[] => read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  get: (id: string) => read().find((p) => p.id === id),
  save<T>(kind: ProjectKind, title: string, data: T, id?: string): Project<T> {
    const now = new Date().toISOString();
    const list = read();
    const existing = id ? list.find((p) => p.id === id) : undefined;
    const project: Project<T> = { id: existing?.id ?? `p${Date.now().toString(36)}`, kind, title, createdAt: existing?.createdAt ?? now, updatedAt: now, data };
    write([project, ...list.filter((p) => p.id !== project.id)]);
    return project;
  },
  remove: (id: string) => write(read().filter((p) => p.id !== id)),
};

/** Passes material needs from one tool to another (Renovim → Shporta, SmartCut → Shporta, Voice → Shporta). */
export const handoff = {
  put: (text: string) => { try { sessionStorage.setItem(HANDOFF, text); } catch { /* ignore */ } },
  take: () => { try { const v = sessionStorage.getItem(HANDOFF); sessionStorage.removeItem(HANDOFF); return v; } catch { return null; } },
  /** Structured hand-over: exact listings chosen elsewhere (SmartCut offcuts) go in pinned. */
  putItems: (items: { text: string; category: string; quantity: number; unit: string; listingId?: string }[]) => {
    try { sessionStorage.setItem(HANDOFF, JSON.stringify({ items })); } catch { /* ignore */ }
  },
};
