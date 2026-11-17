import { ALBANIA, project } from "@/lib/albania-map";
import { suppliers } from "@/lib/demo";
import { CITIES, type City } from "@/lib/market";

/** Blueprint map of Albania with demo suppliers. Drawn locally from Natural Earth data: no tile service, no tracking. */
export function SupplierMap({ city, active, highlight, onHover }: { city: City; active: Set<string>; highlight: string | null; onHover?: (id: string | null) => void }) {
  const origin = project(CITIES[city].lng, CITIES[city].lat);
  return (
    <figure className="relative">
      <svg viewBox={`-20 -10 ${ALBANIA.width + 40} ${ALBANIA.height + 20}`} className="h-full max-h-[70vh] w-full" role="img" aria-label={`Harta e furnitorëve, nga ${city}`}>
        <defs>
          <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="var(--color-line)" strokeWidth="0.6" /></pattern>
          <clipPath id="albania-clip"><path d={ALBANIA.path} /></clipPath>
        </defs>
        <path d={ALBANIA.path} fill="var(--color-bg-2)" />
        <rect x="-20" y="-10" width={ALBANIA.width + 40} height={ALBANIA.height + 20} fill="url(#map-grid)" clipPath="url(#albania-clip)" opacity="0.7" />
        <path d={ALBANIA.path} fill="none" stroke="var(--color-ink-2)" strokeWidth="1.2" strokeLinejoin="round" />
        {(Object.keys(CITIES) as City[]).map((name) => {
          const [x, y] = project(CITIES[name].lng, CITIES[name].lat);
          return <text key={name} x={x + (name === "Durrës" || name === "Vlorë" ? -10 : 10)} y={y - 10} textAnchor={name === "Durrës" || name === "Vlorë" ? "end" : "start"} className="fill-ink-2 text-[13px]">{name}</text>;
        })}
        {suppliers.map((s) => {
          const [x, y] = project(s.lng, s.lat);
          const on = active.has(s.id);
          const hot = highlight === s.id;
          return (
            <g key={s.id} onMouseEnter={() => onHover?.(s.id)} onMouseLeave={() => onHover?.(null)}>
              {on && <line x1={origin[0]} y1={origin[1]} x2={x} y2={y} stroke="var(--color-lime)" strokeOpacity={hot ? 0.9 : 0.25} strokeDasharray="3 4" />}
              <circle cx={x} cy={y} r={hot ? 9 : on ? 6 : 3.5} fill={on ? "var(--color-lime)" : "var(--color-line)"} fillOpacity={on ? 0.9 : 1} stroke={hot ? "var(--color-ink)" : "none"} strokeWidth="1.5" />
              <title>{`${s.name} · ${s.area}, ${s.city}`}</title>
            </g>
          );
        })}
        <g transform={`translate(${origin[0]} ${origin[1]})`}>
          <circle r="14" fill="none" stroke="var(--color-ink)" strokeOpacity="0.5"><animate attributeName="r" values="8;20;8" dur="3s" repeatCount="indefinite" /><animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" /></circle>
          <circle r="5" fill="var(--color-ink)" />
        </g>
      </svg>
      <figcaption className="mt-2 text-[11px] text-ink-2">Harta: Natural Earth (domen publik). Furnitorët janë të shpikur për demonstrim.</figcaption>
    </figure>
  );
}
