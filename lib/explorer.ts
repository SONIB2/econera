import type { MaterialInput } from "./data";

type Zone = {
  category: MaterialInput["category"];
  title: string;
  part: string;
  description: string;
  examples: string[];
  x: number;
  y: number;
};

export const zones = [
  { category: "guri", title: "Tulla dhe muraturë", part: "Muret", description: "Nga tulla e rikuperuar te blloqet e papërdorura, materialet e muraturës mund të gjejnë vend në një projekt tjetër.", examples: ["Tulla argjile", "Tulla me zgavra", "Blloqe betoni", "Tulla të rikuperuara"], x: 23, y: 57 },
  { category: "dru", title: "Dru dhe parket", part: "Dyshemeja", description: "Shfleto dërrasa, parket dhe materiale për dysheme sipas gjendjes, sasisë dhe vendndodhjes.", examples: ["Parket druri masiv", "Parket shumështresor", "Laminat", "Dru i rikuperuar"], x: 37, y: 68 },
  { category: "beton", title: "Beton", part: "Themelet", description: "Zbulo elemente të parapërgatitura dhe materiale betoni. Për përdorim strukturor kërko dokumentacion dhe vlerësim profesional.", examples: ["Elemente të parapërgatitura", "Pllaka betoni", "Elemente bordure"], x: 55, y: 82 },
  { category: "xham", title: "Dritare dhe xham", part: "Hapjet", description: "Gjej dritare, vetrata dhe xham të listuar për ripërdorim ose të mbetur nga ndërtime.", examples: ["Dritare", "Vetrata", "Xham izolues"], x: 72, y: 48 },
  { category: "cati", title: "Çati dhe mbulim", part: "Çatia", description: "Zbulo tjegulla dhe materiale mbulimi që mund të përdoren në një ndërtim ose restaurim tjetër.", examples: ["Tjegulla qeramike", "Panele mbulimi", "Aksesorë çatie"], x: 70, y: 16 },
] as const satisfies readonly Zone[];
