/**
 * Founders shown on the About page. Edit only with information the founders have provided or approved.
 * - photo: path under /public (e.g. "/team/sonila.jpg"); leave undefined to show the monogram.
 * - linkedin: full profile URL; leave undefined to hide the link.
 * - bio: short, factual; no invented qualifications or achievements.
 */
export type Founder = {
  name: string;
  initials: string;
  role: { sq: string; en: string };
  bio: { sq: string; en: string };
  photo?: string;
  linkedin?: string;
};

export const FOUNDERS: Founder[] = [
  {
    name: "Sonila Balla",
    initials: "SB",
    role: { sq: "Themeluese · CEO & CTO", en: "Founder · CEO & CTO" },
    bio: { sq: "Ka zhvilluar platformën. Project Manager në projekte ndërkombëtare.", en: "Built the platform. Project Manager on international projects." },
  },
  {
    name: "Rey Sylaj",
    initials: "RS",
    role: { sq: "Bashkëthemelues", en: "Co-founder" },
    bio: { sq: "Biznesi, furnitorët, kontraktorët dhe piloti në terren.", en: "Business development, suppliers, contractors and the pilot on the ground." },
  },
];
