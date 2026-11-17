/** Deterministic formatting (same on server and browser, unlike Intl with differing ICU data). Matches the deck: 1,500,000 and 0.21. */
export function formatNumber(value: number, digits = 1) {
  let fixed = Math.abs(value).toFixed(digits);
  if (fixed.includes(".")) fixed = fixed.replace(/\.?0+$/, "");
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "−" : ""}${grouped}${dec ? `.${dec}` : ""}`;
}

const MONTHS = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];
export function formatDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
