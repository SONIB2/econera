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

/* Navigation and footer glyphs, same grid and stroke as the tool icons. */
export function SellIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.2 6.2a1.4 1.4 0 0 1-2 0z" /><circle cx="8" cy="8" r="1.3" /><path d="M13 13.5h4M15 11.5v4" /></svg>;
}
export function BuildingIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4 20.5V8l6-3.5v16M10 20.5V9.5l10 3v8M2.5 20.5h19" /><path d="M6.5 10.5v.01M6.5 14v.01M13.5 14.5h3M13.5 17.5h3" /></svg>;
}
export function FactoryIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M3.5 20.5v-9l5 3v-3l5 3v-3l5 3V4.5h2v16z" /><path d="M2.5 20.5h19M7 17.5h2M12 17.5h2" /></svg>;
}
export function CompassIcon({ className }: P) {
  return <svg {...base} className={className}><circle cx="12" cy="5" r="1.8" /><path d="m11 6.6-5.5 13M13 6.6l5.5 13M7.5 14.5h9" /></svg>;
}
export function PriceIcon({ className }: P) {
  return <svg {...base} className={className}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M9 15l6-6" /><circle cx="9.3" cy="9.3" r="1" /><circle cx="14.7" cy="14.7" r="1" /></svg>;
}
export function HandshakeIcon({ className }: P) {
  return <svg {...base} className={className}><path d="m2.5 11 3.5-4 4 1.5L12.5 7l3 .5 3.5-1.5 2.5 4.5-2.5 2" /><path d="m19 12.5-5.5 5a1.5 1.5 0 0 1-2.1 0L7 13" /><path d="M5 12.5 3.5 11M10 8.5 8 11a1.4 1.4 0 0 0 2 2l2.5-2 4 3.5" /></svg>;
}
export function BookIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M12 6.5c-2-1.5-5-2-8.5-1.5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5v13" /></svg>;
}
export function MailIcon({ className }: P) {
  return <svg {...base} className={className}><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 6.5 8 6 8-6" /></svg>;
}
export function PinIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" /></svg>;
}
export function GlobeIcon({ className }: P) {
  return <svg {...base} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.2 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.2-3.8-8.5S9.5 5.9 12 3.5z" /></svg>;
}
export function LeafIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M5 19c0-8 5-13.5 14.5-14-.5 9.5-6 14.5-14 14z" /><path d="M5 19 13 11" /></svg>;
}
export function GrowthIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4.5 20v-4M9.5 20v-7M14.5 20v-5M19.5 20V9" /><path d="m4 11 5-4.5 4 3 6.5-5.5M15.5 4h4v4" /></svg>;
}
export function SparkleIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M10 3.5 11.8 8.2 16.5 10l-4.7 1.8L10 16.5l-1.8-4.7L3.5 10l4.7-1.8z" /><path d="M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></svg>;
}
export function MicIcon({ className }: P) {
  return <svg {...base} className={className}><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" /></svg>;
}
export function ChatIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4 12a8 7 0 1 1 3.5 5.8L4 19.5l1.2-3.4A6.7 6.7 0 0 1 4 12z" /></svg>;
}
