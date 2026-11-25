/** Small illustrative previews of the four ECONERA AI tools (original SVG, no stock imagery). */
export function RenovationVisual() {
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="200" height="200" fill="#dfe5e1" /><rect x="200" width="200" height="200" fill="#f1ece2" />
      <path d="M0 150h200" stroke="#a9b3ae" strokeWidth="2" /><rect x="30" y="60" width="60" height="70" fill="#c8cfcb" /><rect x="110" y="110" width="70" height="40" fill="#b3bcb7" />
      <path d="M200 150h200" stroke="#c9b48f" strokeWidth="2" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={200 + i * 25} y={150} width={24} height={50} fill={i % 2 ? "#d8bf95" : "#cfb387"} />)}
      <rect x="230" y="60" width="60" height="70" fill="#fbfaf6" stroke="#d9cdb6" /><rect x="310" y="105" width="70" height="45" rx="8" fill="#8ea38f" />
      <circle cx="350" cy="50" r="18" fill="#c8f169" opacity=".7" /><path d="M200 0v200" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
export function BasketVisual() {
  const rows = [["Parket lisi", "#cfb387", 0.82], ["Pllaka bezhë", "#e5d6bb", 0.6], ["Dyer", "#9fb3a6", 0.44], ["Bojë", "#f3efe6", 0.3]] as const;
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="400" height="200" fill="#e9f1ec" />
      {rows.map(([l, c, w], i) => <g key={l}><rect x="40" y={28 + i * 38} width={320} height="28" rx="14" fill="#fff" /><rect x="40" y={28 + i * 38} width={320 * w} height="28" rx="14" fill={c} /><text x="54" y={47 + i * 38} fontSize="12" fill="#0c2f2b" fontFamily="sans-serif">{l}</text></g>)}
    </svg>
  );
}
export function CutVisual() {
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="400" height="200" fill="#e9f1ec" /><rect x="60" y="25" width="280" height="150" fill="#fff" stroke="#0f4a43" strokeWidth="2" />
      <rect x="64" y="29" width="110" height="70" fill="#cfe8c0" stroke="#0c2f2b" /><rect x="178" y="29" width="90" height="70" fill="#e7d7b0" stroke="#0c2f2b" /><rect x="64" y="103" width="80" height="68" fill="#bcd7e8" stroke="#0c2f2b" />
      <rect x="148" y="103" width="120" height="68" fill="#e9c9c0" stroke="#0c2f2b" /><rect x="272" y="29" width="64" height="142" fill="#f4f8f5" stroke="#7fb52a" strokeDasharray="6 4" />
      {[["A", 119, 68], ["B", 223, 68], ["C", 104, 141], ["D", 208, 141]].map(([l, x, y]) => <text key={l} x={x} y={y} fontSize="16" fontWeight="600" textAnchor="middle" fill="#0c2f2b" fontFamily="sans-serif">{l}</text>)}
    </svg>
  );
}
export function VoiceVisual() {
  const bars = [14, 26, 40, 22, 52, 30, 64, 38, 24, 46, 18, 34, 12];
  return (
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden>
      <rect width="400" height="200" fill="#e9f1ec" /><circle cx="200" cy="100" r="54" fill="#dcf3b8" /><circle cx="200" cy="100" r="36" fill="#0f4a43" />
      <rect x="192" y="80" width="16" height="28" rx="8" fill="none" stroke="#fff" strokeWidth="3" /><path d="M184 102a16 16 0 0 0 32 0M200 118v8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      {bars.map((h, i) => <rect key={i} x={30 + i * 9} y={100 - h / 2} width="4" height={h} rx="2" fill="#7fb52a" />)}
      {bars.map((h, i) => <rect key={`r${i}`} x={262 + i * 9} y={100 - h / 2} width="4" height={h} rx="2" fill="#7fb52a" />)}
    </svg>
  );
}
