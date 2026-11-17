export type Destination = "intro" | "portal" | "house" | "masonry";
export type WorldPhase = Destination | "approaching" | "opening" | "entering" | "focusing";
export type WorldAction = "approach" | "open" | "inspect" | "arrived";

export function worldDestination(value: string | string[] | null | undefined): Destination {
  return value === "portal" || value === "house" || value === "masonry" ? value : "intro";
}

export function advanceWorld(phase: WorldPhase, action: WorldAction): WorldPhase {
  if (phase === "intro" && action === "approach") return "approaching";
  if (phase === "portal" && action === "open") return "opening";
  if (phase === "house" && action === "inspect") return "focusing";
  if (action !== "arrived") return phase;
  switch (phase) {
    case "approaching": return "portal";
    case "opening": return "entering";
    case "entering": return "house";
    case "focusing": return "masonry";
    default: return phase;
  }
}
