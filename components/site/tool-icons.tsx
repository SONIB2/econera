/**
 * ECONERA Intelligence product icons: one hand-drawn line glyph per tool, 24px grid, 1.6 stroke.
 * They inherit currentColor so they work in light mode (teal) and dark mode (lime).
 */
type P = { className?: string };
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/** A room in plan view with a spark: design with AI. */
export function RenovationIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9h12v-9" /><path d="M10.5 19v-4.5h3V19" /><path d="M19.5 2.5v3M18 4h3" /></svg>;
}
/** A basket whose contents are stacked blocks: materials matched to a budget. */
export function BasketIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M3.5 9.5h17l-1.6 8.6a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6z" /><path d="M8 9.5 11 4M16 9.5 13 4" /><path d="M9 13.5v3M12 13v3.5M15 13.5v3" /></svg>;
}
/** A panel divided by an optimised cutting line. */
export function CutIcon({ className }: P) {
  return <svg {...base} className={className}><rect x="3.5" y="4" width="17" height="16" rx="1.5" /><path d="M11 4v16" strokeDasharray="2 2.2" /><path d="M11 12h9.5" strokeDasharray="2 2.2" /><circle cx="7" cy="8" r="0.6" fill="currentColor" /></svg>;
}
/** A sound wave: talk to ECONERA. */
export function VoiceIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4 10.5v3M8 7.5v9M12 4.5v15M16 7.5v9M20 10.5v3" /></svg>;
}
/** Stacked material slabs: the marketplace. */
export function MarketIcon({ className }: P) {
  return <svg {...base} className={className}><path d="m12 4 8 4-8 4-8-4z" /><path d="m4 12 8 4 8-4" /><path d="m4 16 8 4 8-4" /></svg>;
}
/** A shield with a check: verified materials and documents. */
export function VerifyIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>;
}
export function ArrowIcon({ className }: P) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}><path d="M4 10 10 4M5 4h5v5" /></svg>;
}

export const TOOL_ICON = { renovation: RenovationIcon, basket: BasketIcon, smartcut: CutIcon, voice: VoiceIcon };
