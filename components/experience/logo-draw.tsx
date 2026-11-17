/** ECONERA logo traced as wireframe strokes, then filled. Paths mirror public/brand/logo-dark.svg. */
export function LogoDraw({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 481 66" className={`logo-draw ${className}`} role="img" aria-label="ECONERA">
      <g transform="translate(3 1)">
        <path className="ld-mark ld-mark-a" pathLength={1} d="M6 17 38 2l13 7-31 16zM6 33l24-12 12 7-22 12zM6 49l30-15 13 7-29 15z" />
        <path className="ld-mark ld-mark-b" pathLength={1} d="M6 17l14 8v31L6 49zM20 25 51 9v8L20 33zm0 15 22-12v7L20 48zm0 16 29-15v8L20 64z" />
        <path className="ld-mark ld-mark-c" pathLength={1} d="M20 33v7L6 33l9-5zm0 15v8L6 49l9-5z" />
      </g>
      <g transform="translate(77 4)">
        <g className="ld-word" fill="none" strokeWidth="8">
          <path pathLength={1} d="M40 7H6v44h34M6 29h30M95 14A23 22 0 1 0 95 44" />
          <ellipse pathLength={1} cx="135" cy="29" rx="24" ry="22" />
          <path pathLength={1} d="M177 55V7h2l36 44h2V3m55 4h-34v44h34m-34-22h30m20 26V7h22c19 0 19 22 0 22h-22m21 0 21 24m12 0 26-46h2l27 46" />
        </g>
        <path className="ld-accent" d="m357 53 11-19 11 19z" />
      </g>
    </svg>
  );
}
