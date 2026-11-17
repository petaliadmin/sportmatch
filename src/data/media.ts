/**
 * Photo library (Unsplash, hotlinked as required by the Unsplash API guidelines).
 * Each entry carries the photographer credit, shown on hover/long-press.
 * Empty slots fall back to the SVG <SportVisual/> automatically.
 */
export interface MediaPhoto { url: string; credit: string; creditUrl: string; alt: string }

export const media: Record<string, MediaPhoto | undefined> = {
  // filled from Unsplash: venue-v1 … venue-v8, sport-football, sport-basketball,
  // hero-home, onboarding-1..3, event-hero, stadium, player-*
};

const UTM = "?utm_source=sportmatch&utm_medium=referral";
export const unsplashCredit = (p: MediaPhoto) => ({ name: p.credit, href: p.creditUrl + UTM, site: "https://unsplash.com/" + UTM });
