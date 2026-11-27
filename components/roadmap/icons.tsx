/** Line icons for the ECONERA product roadmap, drawn on the same 24px grid and 1.6 stroke as tool-icons. */
import { BasketIcon, CutIcon, HandshakeIcon, MarketIcon, RenovationIcon, VerifyIcon, VoiceIcon } from "@/components/site/tool-icons";

type P = { className?: string };
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/** Shelving with boxes. */
function InventoryIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4 3.5v17M20 3.5v17M4 12h16M4 20.5h16" /><rect x="7" y="7" width="4" height="5" /><rect x="12.5" y="8.5" width="4" height="3.5" /><rect x="8" y="15.5" width="5" height="5" /></svg>;
}
/** A document with a magnifier. */
function TenderIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M13 20.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h8l4 4V11" /><path d="M13.5 3.5V8H18" /><path d="M8 11h5M8 14h3" /><circle cx="16.5" cy="16" r="2.8" /><path d="m18.6 18.1 2 2" /></svg>;
}
/** Rising bars with a trend line. */
function FinanceIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M4 20.5h16" /><path d="M6.5 20.5v-4M11 20.5v-7M15.5 20.5v-5.5M20 20.5v-9" /><path d="m5 11 5-4.5 4 3 6-5.5" /><path d="M17 4h3v3" /></svg>;
}
/** A calculator. */
function EstimatorIcon({ className }: P) {
  return <svg {...base} className={className}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8v3H8z" /><path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17h.01M12 17h.01M15.5 17h.01" strokeWidth="2.2" /></svg>;
}
/** A hard hat. */
function ProjectIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M3 17.5h18" /><path d="M5 17.5V15a7 7 0 0 1 14 0v2.5" /><path d="M10 8.3V6h4v2.3" /><path d="M12 8v4" /><path d="M4 20.5h16" /></svg>;
}
/** A truck with a route point. */
function LogisticsIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M2.5 7h11v9.5h-11z" /><path d="M13.5 10h4l3 3.5v3h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /><path d="M18.5 3.5c-1.4 0-2.5 1-2.5 2.4 0 1.7 2.5 3.6 2.5 3.6S21 7.6 21 5.9c0-1.4-1.1-2.4-2.5-2.4z" /></svg>;
}
/** A leaf over a gauge: carbon measured. */
function CarbonIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M3.5 18a8.5 8.5 0 0 1 17 0" /><path d="m12 18 3.5-4" /><path d="M9 9.5c0-3 2.4-5.5 6.5-6-.3 4-2.6 6.5-5.5 6.5" /><path d="M9 11.5c.8-1.6 2-2.9 3.5-3.8" /></svg>;
}
/** A document with a scan line and a spark. */
function DocumentAiIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M14 3.5H6.5A1.5 1.5 0 0 0 5 5v14a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5z" /><path d="M14 3.5v5h5" /><path d="M3 13.5h18" /><path d="M8.5 17h4" /><path d="M16.5 16v3M15 17.5h3" /></svg>;
}
/** A line chart with data points. */
function MarketIntelIcon({ className }: P) {
  return <svg {...base} className={className}><path d="M3.5 3.5v17h17" /><path d="m7 15 3.5-4 3 2.5 5.5-6.5" /><circle cx="7" cy="15" r="1" /><circle cx="10.5" cy="11" r="1" /><circle cx="13.5" cy="13.5" r="1" /><circle cx="19" cy="7" r="1" /></svg>;
}
/** Two linked blocks: systems connected. */
function ErpIcon({ className }: P) {
  return <svg {...base} className={className}><rect x="3" y="4" width="7.5" height="6" rx="1.2" /><rect x="13.5" y="14" width="7.5" height="6" rx="1.2" /><path d="M6.75 10v3.5a1.5 1.5 0 0 0 1.5 1.5h5.25" /><path d="M17.25 14v-3.5a1.5 1.5 0 0 0-1.5-1.5H10.5" /></svg>;
}

export const ROADMAP_ICONS: Record<string, (p: P) => React.JSX.Element> = {
  marketplace: MarketIcon, passport: VerifyIcon, basket: BasketIcon, smartcut: CutIcon, renovation: RenovationIcon, voice: VoiceIcon, partners: HandshakeIcon,
  "smart-inventory": InventoryIcon, tender: TenderIcon, finance: FinanceIcon, estimator: EstimatorIcon, project: ProjectIcon,
  logistics: LogisticsIcon, carbon: CarbonIcon, "document-ai": DocumentAiIcon, "market-intel": MarketIntelIcon, erp: ErpIcon,
};
