import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export default async function NoAccess() {
  const lang = await getLang();
  return (
    <div className="card p-8">
      <h1 className="display text-4xl">{tr(lang, "Nuk ke akses në administrim.", "You do not have admin access.")}</h1>
      <p className="mt-3 text-ink-2">{tr(lang, "Paneli është vetëm për stafin e ECONERA-s me rol të caktuar nga një Super Admin.", "The panel is only for ECONERA staff with a role granted by a Super Admin.")}</p>
    </div>
  );
}
