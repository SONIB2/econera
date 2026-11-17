import Link from "next/link";
import type { ReactNode } from "react";

const messages: Record<string, string> = {
  unavailable: "Shërbimi nuk është konfiguruar ende.",
  invalid: "Kontrollo të dhënat e formularit dhe provo përsëri.",
  credentials: "Nuk mundëm të të identifikonim. Kontrollo emailin, fjalëkalimin dhe konfirmimin e llogarisë.",
  email: "Nëse adresa mund të përdoret, do të marrësh një email me udhëzime.",
  link: "Lidhja ka skaduar ose nuk mund të përdoret në këtë shfletues.",
  saved: "Ndryshimet u ruajtën.",
  password: "Fjalëkalimi u ndryshua. Hyr përsëri.",
  conflict: "Materiali nuk u përditësua. Rifresko faqen dhe kontrollo gjendjen e tij.",
  failed: "Kërkesa nuk u krye. Provo përsëri më vonë.",
  "quote-sent": "Kërkesa u dërgua te shitësi.",
  "quote-unavailable": "Kërkesa nuk mund të dërgohet. Kontrollo sasinë, mënyrën e marrjes dhe gjendjen e materialit.",
  "organization-created": "Organizata u krijua.",
  "organization-joined": "U bashkove me organizatën.",
  "invite-unavailable": "Kodi nuk mund të përdoret me këtë llogari.",
};

export function Notice({ status }: { status?: string }) {
  if (!status || !Object.hasOwn(messages, status)) return null;
  return <p className="notice" role="status">{messages[status]}</p>;
}

export function Empty({ title, children, href, label }: { title: string; children: ReactNode; href?: string; label?: string }) {
  return <section className="empty"><h2>{title}</h2><p>{children}</p>{href && label && <Link className="button secondary" href={href}>{label}</Link>}</section>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <header className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p>{children}</p>}</header>;
}
