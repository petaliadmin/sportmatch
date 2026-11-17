import type { SportKey } from "@/components/visual/sport-visual";
export type { SportKey };

export type Level = "Débutant" | "Intermédiaire" | "Confirmé" | "Expert";

export interface Venue {
  id: string;
  name: string;
  kind: "Terrain synthétique" | "Gymnase" | "Court de tennis" | "Padel" | "Aire de jeux" | "Stade";
  sports: SportKey[];
  district: string;
  address: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  pricePerHour: number;
  surface: string;
  capacity: string;
  amenities: string[];
  verified: boolean;
  map: { x: number; y: number };
  openHours: [number, number];
  courts: string[];
}

export interface Player {
  id: string;
  name: string;
  district: string;
  distanceKm: number;
  level: Level;
  sports: SportKey[];
  position: string;
  reliability: number;
  matches: number;
  availableTonight: boolean;
  rating: number;
  bio: string;
}

export interface Match {
  id: string;
  sport: SportKey;
  format: string;
  title: string;
  venueId: string;
  date: string; // ISO day offset label
  dayOffset: number;
  time: string;
  durationMin: number;
  level: Level;
  pricePerPlayer: number;
  capacity: number;
  participants: string[]; // player ids
  organizerId: string;
  paidCount: number;
  visibility: "Public" | "Privé";
  description?: string;
}

export type ProviderCategory =
  | "infrastructures"
  | "arbitres"
  | "transport"
  | "medical"
  | "securite"
  | "restauration"
  | "personnel"
  | "materiel"
  | "media";

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  district: string;
  distanceKm: number;
  rating: number;
  reviews: number;
  verified: boolean;
  responseTime: string;
  unit: string; // pricing unit
  price: number;
  description: string;
  highlights: string[];
  capacity?: string;
  availability: "Disponible" | "Limité" | "Complet";
}

export interface BookingRecord {
  id: string;
  kind: "terrain" | "match" | "service";
  title: string;
  subtitle: string;
  dateLabel: string;
  amount: number;
  status: "Confirmée" | "En attente" | "Annulée" | "Terminée";
  payment: "Intégral" | "Acompte" | "Partagé";
  paidRatio: number;
  sport?: SportKey;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "match" | "booking" | "payment" | "smartfill" | "system";
}
