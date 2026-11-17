import type { AppNotification, BookingRecord } from "./types";

export const initialBookings: BookingRecord[] = [
  { id: "b1", kind: "terrain", title: "Arena Almadies Five · Terrain A", subtitle: "Football 5v5 · 1 h", dateLabel: "Sam. 14 nov. · 18:00", amount: 30000, status: "Terminée", payment: "Partagé", paidRatio: 1, sport: "football" },
  { id: "b2", kind: "match", title: "Run basket Ouakam", subtitle: "Participation joueur", dateLabel: "Aujourd'hui · 20:00", amount: 1000, status: "Confirmée", payment: "Intégral", paidRatio: 1, sport: "basketball" },
  { id: "b3", kind: "terrain", title: "Padel House Ngor · Piste 2", subtitle: "Padel double · 1 h 30", dateLabel: "Mer. 11 nov. · 19:00", amount: 30000, status: "Terminée", payment: "Intégral", paidRatio: 1, sport: "padel" },
  { id: "b4", kind: "terrain", title: "Complexe Mermoz Sport · Five 1", subtitle: "Football 5v5 · 1 h", dateLabel: "Mar. 3 nov. · 21:00", amount: 25000, status: "Annulée", payment: "Acompte", paidRatio: 0.3, sport: "football" },
];

export const initialNotifications: AppNotification[] = [
  { id: "n1", kind: "smartfill", title: "Smart Fill : Awa a accepté", body: "Five du mardi soir · 8/10 joueurs.", time: "il y a 5 min", read: false },
  { id: "n2", kind: "payment", title: "Paiement reçu", body: "Pape Gueye a réglé sa part (3 000 FCFA).", time: "il y a 22 min", read: false },
  { id: "n3", kind: "match", title: "Nouveau match près de toi", body: "Futsal du jeudi · Point E · 5 places.", time: "il y a 1 h", read: false },
  { id: "n4", kind: "booking", title: "Rappel de réservation", body: "Arena Almadies · Terrain A ce soir 19:00.", time: "il y a 3 h", read: true },
  { id: "n5", kind: "system", title: "Ton score de fiabilité monte à 94", body: "12 présences confirmées d'affilée.", time: "hier", read: true },
];

export const conversations = [
  { id: "c1", name: "Five du mardi soir", group: true, last: "Awa : Je ramène des chasubles 👍", time: "18:42", unread: 2 },
  { id: "c2", name: "Ibrahima Fall", group: false, last: "Ok pour gardien ce soir", time: "17:10", unread: 0 },
  { id: "c3", name: "Arena Almadies Five", group: false, last: "Votre réservation est confirmée.", time: "Hier", unread: 0 },
  { id: "c4", name: "Run basket Ouakam", group: true, last: "Mariama : On commence à 20h pile", time: "Hier", unread: 0 },
];

export const chatSeed: Record<string, { from: string; text: string; time: string; me?: boolean }[]> = {
  c1: [
    { from: "Pape Gueye", text: "Qui ramène le ballon ce soir ?", time: "18:30" },
    { from: "Moi", text: "Je l'ai, et le terrain A est confirmé ✅", time: "18:34", me: true },
    { from: "Awa Ndiaye", text: "Je ramène des chasubles 👍", time: "18:42" },
  ],
  c2: [{ from: "Ibrahima Fall", text: "Ok pour gardien ce soir", time: "17:10" }],
  c3: [{ from: "Arena Almadies Five", text: "Votre réservation est confirmée.", time: "Hier" }],
  c4: [{ from: "Mariama Diallo", text: "On commence à 20h pile", time: "Hier" }],
};
