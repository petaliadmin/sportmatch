import type { Player } from "./types";

export const ME = "p0";

export const players: Player[] = [
  { id: "p0", name: "Moussa Diop", district: "Mermoz", distanceKm: 0, level: "Confirmé", sports: ["football", "basketball"], position: "Milieu", reliability: 94, matches: 87, availableTonight: true, rating: 4.7, bio: "Foot à 5 deux fois par semaine. Toujours à l'heure." },
  { id: "p1", name: "Awa Ndiaye", district: "Ouakam", distanceKm: 1.4, level: "Confirmé", sports: ["football"], position: "Attaquante", reliability: 97, matches: 64, availableTonight: true, rating: 4.9, bio: "Ex-joueuse universitaire, rapide sur le côté." },
  { id: "p2", name: "Ibrahima Fall", district: "Almadies", distanceKm: 2.1, level: "Expert", sports: ["football"], position: "Gardien", reliability: 92, matches: 140, availableTonight: true, rating: 4.8, bio: "Gardien disponible en semaine après 18h." },
  { id: "p3", name: "Fatou Sarr", district: "Mermoz", distanceKm: 0.8, level: "Intermédiaire", sports: ["football", "volley"], position: "Défenseure", reliability: 88, matches: 33, availableTonight: true, rating: 4.5, bio: "Je joue pour le plaisir et le cardio." },
  { id: "p4", name: "Cheikh Ba", district: "Liberté 6", distanceKm: 3.6, level: "Confirmé", sports: ["football", "basketball"], position: "Défenseur", reliability: 81, matches: 52, availableTonight: false, rating: 4.3, bio: "Polyvalent, bon jeu de tête." },
  { id: "p5", name: "Mariama Diallo", district: "Point E", distanceKm: 2.9, level: "Confirmé", sports: ["basketball"], position: "Meneuse", reliability: 95, matches: 71, availableTonight: true, rating: 4.8, bio: "Basket 5v5 et 3x3." },
  { id: "p6", name: "Ousmane Sy", district: "Yoff", distanceKm: 4.8, level: "Intermédiaire", sports: ["football"], position: "Milieu", reliability: 74, matches: 19, availableTonight: true, rating: 4.0, bio: "Nouveau à Dakar, je cherche des matchs réguliers." },
  { id: "p7", name: "Aïssatou Kane", district: "Fann", distanceKm: 3.3, level: "Expert", sports: ["tennis", "padel"], position: "Droitière", reliability: 98, matches: 120, availableTonight: false, rating: 4.9, bio: "Classée régionale, ouverte aux doubles." },
  { id: "p8", name: "Lamine Faye", district: "Ngor", distanceKm: 2.4, level: "Confirmé", sports: ["football", "padel"], position: "Attaquant", reliability: 90, matches: 58, availableTonight: true, rating: 4.6, bio: "Finisseur, pied gauche." },
  { id: "p9", name: "Khady Mbaye", district: "Sacré-Cœur", distanceKm: 3.0, level: "Intermédiaire", sports: ["basketball", "volley"], position: "Ailière", reliability: 86, matches: 27, availableTonight: true, rating: 4.4, bio: "Toujours partante pour un 3x3." },
  { id: "p10", name: "Pape Gueye", district: "Mermoz", distanceKm: 0.5, level: "Confirmé", sports: ["football"], position: "Défenseur", reliability: 91, matches: 76, availableTonight: true, rating: 4.6, bio: "Solide en défense, bon esprit." },
  { id: "p11", name: "Seynabou Cissé", district: "Almadies", distanceKm: 1.9, level: "Débutant", sports: ["tennis", "running"], position: "—", reliability: 83, matches: 8, availableTonight: true, rating: 4.2, bio: "Je débute, patiente et motivée." },
  { id: "p12", name: "Abdou Thiam", district: "Ouakam", distanceKm: 1.6, level: "Confirmé", sports: ["football"], position: "Milieu", reliability: 89, matches: 61, availableTonight: true, rating: 4.5, bio: "Box-to-box." },
  { id: "p13", name: "Ndeye Sow", district: "Liberté 6", distanceKm: 3.8, level: "Expert", sports: ["handball", "basketball"], position: "Pivot", reliability: 93, matches: 99, availableTonight: false, rating: 4.7, bio: "Ancienne joueuse de N1." },
];

export const playerById = (id: string) => players.find((p) => p.id === id)!;

/** Compatibility score — weights from the product spec (dispo 30, distance 25, niveau 20, sport/poste 15, fiabilité 10). */
export function compatibility(p: Player, sport: string, level: string): number {
  const levels = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];
  const dispo = p.availableTonight ? 30 : 8;
  const dist = Math.max(0, 25 - p.distanceKm * 4);
  const lvl = 20 - Math.abs(levels.indexOf(p.level) - levels.indexOf(level)) * 7;
  const sp = p.sports.includes(sport as never) ? 15 : 0;
  const rel = (p.reliability / 100) * 10;
  return Math.round(Math.max(0, Math.min(100, dispo + dist + Math.max(0, lvl) + sp + rel)));
}
