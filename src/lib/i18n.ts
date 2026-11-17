import type { Lang } from "./store";

/** Chrome-level strings. Screens stay in FR for the Dakar pilot; keys are ready for extraction (next-intl). */
const dict = {
  fr: { home: "Accueil", explore: "Explorer", matches: "Matchs", bookings: "Réservations", profile: "Profil", search: "Rechercher", demo: "Données fictives" },
  en: { home: "Home", explore: "Explore", matches: "Matches", bookings: "Bookings", profile: "Profile", search: "Search", demo: "Demo data" },
} as const;

export type I18nKey = keyof (typeof dict)["fr"];
export const t = (lang: Lang, key: I18nKey) => dict[lang][key];
