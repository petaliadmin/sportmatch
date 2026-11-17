import { Ambulance, Bus, ChefHat, Flag, Shield, Building2, type LucideIcon } from "lucide-react";

export type BizKind = "stade" | "arbitre" | "transport" | "traiteur" | "securite" | "medical";

export interface BizProfile {
  kind: BizKind;
  company: string;
  owner: string;
  icon: LucideIcon;
  label: string;
  unit: string;
  resourcesLabel: string; // HR screen
  assetsLabel: string; // vehicles / equipment screen
  services: { id: string; name: string; price: number; unit: string; active: boolean; detail: string }[];
  people: { id: string; name: string; role: string; status: "Disponible" | "En mission" | "Repos"; cert?: string }[];
  assets: { id: string; name: string; meta: string; status: "Disponible" | "Réservé" | "Maintenance" }[];
  kpiLabel: string;
  calendarLabel: string;
}

export const profiles: Record<BizKind, BizProfile> = {
  stade: {
    kind: "stade", company: "Arena Almadies Five", owner: "Ousmane Ndiaye", icon: Building2, label: "Infrastructure sportive", unit: "créneau",
    resourcesLabel: "Personnel du site", assetsLabel: "Terrains & équipements", kpiLabel: "Taux d’occupation", calendarLabel: "Créneaux des terrains",
    services: [
      { id: "o1", name: "Terrain A · Five 5v5", price: 30000, unit: "heure", active: true, detail: "Gazon 4G, éclairage LED" },
      { id: "o2", name: "Terrain B · Five 5v5", price: 30000, unit: "heure", active: true, detail: "Gazon 4G" },
      { id: "o3", name: "Terrain C · Foot à 7", price: 45000, unit: "heure", active: true, detail: "Vestiaires dédiés" },
      { id: "o4", name: "Privatisation complexe (tournoi)", price: 250000, unit: "demi-journée", active: false, detail: "3 terrains + buvette" },
    ],
    people: [
      { id: "h1", name: "Mame Diarra Fall", role: "Responsable accueil", status: "Disponible" },
      { id: "h2", name: "Ibou Sène", role: "Agent d’entretien", status: "En mission" },
      { id: "h3", name: "Saliou Ka", role: "Gardien de nuit", status: "Repos" },
    ],
    assets: [
      { id: "a1", name: "Terrain A", meta: "Five · éclairage 400 lux", status: "Réservé" },
      { id: "a2", name: "Terrain B", meta: "Five · éclairage 400 lux", status: "Disponible" },
      { id: "a3", name: "Terrain C", meta: "Foot à 7", status: "Maintenance" },
      { id: "a4", name: "Lot chasubles x40", meta: "2 couleurs", status: "Disponible" },
    ],
  },
  arbitre: {
    kind: "arbitre", company: "Mamadou Kouyaté — Arbitre (fictif)", owner: "Mamadou Kouyaté", icon: Flag, label: "Arbitre & officiel", unit: "mission",
    resourcesLabel: "Mon réseau d’officiels", assetsLabel: "Qualifications & équipement", kpiLabel: "Missions ce mois", calendarLabel: "Mes disponibilités",
    services: [
      { id: "o1", name: "Arbitrage futsal (2 × 20 min)", price: 15000, unit: "match", active: true, detail: "Niveau régional" },
      { id: "o2", name: "Arbitrage foot à 7", price: 18000, unit: "match", active: true, detail: "Avec rapport de match" },
      { id: "o3", name: "Trio arbitral tournoi", price: 120000, unit: "journée", active: true, detail: "Avec 2 assistants" },
    ],
    people: [
      { id: "h1", name: "Cheikh Mbengue", role: "Arbitre assistant", status: "Disponible", cert: "Régional" },
      { id: "h2", name: "Astou Diagne", role: "Arbitre assistante", status: "Disponible", cert: "Régional" },
      { id: "h3", name: "Pape Seck", role: "Délégué de match", status: "En mission", cert: "National" },
    ],
    assets: [
      { id: "a1", name: "Licence arbitre régional", meta: "Valide jusqu’au 30/06/2027", status: "Disponible" },
      { id: "a2", name: "Kit oreillettes", meta: "3 unités", status: "Disponible" },
      { id: "a3", name: "Certificat médical", meta: "À renouveler dans 45 j", status: "Maintenance" },
    ],
  },
  transport: {
    kind: "transport", company: "Teranga Minibus", owner: "Abdoulaye Sy", icon: Bus, label: "Transport", unit: "trajet",
    resourcesLabel: "Chauffeurs", assetsLabel: "Véhicules", kpiLabel: "Trajets ce mois", calendarLabel: "Planning des véhicules",
    services: [
      { id: "o1", name: "Minibus 15 places · trajet urbain", price: 30000, unit: "trajet", active: true, detail: "Climatisé, chauffeur inclus" },
      { id: "o2", name: "Car 30 places · trajet urbain", price: 45000, unit: "trajet", active: true, detail: "Soute bagages" },
      { id: "o3", name: "Mise à disposition journée", price: 150000, unit: "journée", active: true, detail: "10 h, carburant inclus" },
    ],
    people: [
      { id: "h1", name: "Moustapha Diallo", role: "Chauffeur · permis D", status: "En mission" },
      { id: "h2", name: "Daouda Ba", role: "Chauffeur · permis D", status: "Disponible" },
      { id: "h3", name: "Lamine Ndour", role: "Chauffeur · permis D", status: "Repos" },
    ],
    assets: [
      { id: "a1", name: "Toyota Coaster · DK-1234-AB", meta: "30 places · CT valide", status: "Réservé" },
      { id: "a2", name: "Hyundai County · DK-5678-CD", meta: "25 places", status: "Disponible" },
      { id: "a3", name: "Toyota Hiace · DK-9012-EF", meta: "15 places · vidange J+3", status: "Maintenance" },
    ],
  },
  traiteur: {
    kind: "traiteur", company: "Saveurs de la Teranga", owner: "Coumba Thiam", icon: ChefHat, label: "Restauration", unit: "couvert",
    resourcesLabel: "Équipe cuisine & service", assetsLabel: "Menus & capacités", kpiLabel: "Couverts ce mois", calendarLabel: "Capacité de production",
    services: [
      { id: "o1", name: "Menu Thiéboudienne + boisson", price: 3500, unit: "personne", active: true, detail: "Min. 30 couverts" },
      { id: "o2", name: "Menu Yassa poulet + boisson", price: 3000, unit: "personne", active: true, detail: "Min. 30 couverts" },
      { id: "o3", name: "Ravitaillement sportif (eau, fruits)", price: 1000, unit: "personne", active: true, detail: "Livraison sur site" },
    ],
    people: [
      { id: "h1", name: "Adja Ndiaye", role: "Cheffe cuisinière", status: "Disponible" },
      { id: "h2", name: "Fallou Diop", role: "Serveur", status: "Disponible" },
      { id: "h3", name: "Mbayang Sarr", role: "Serveuse", status: "En mission" },
    ],
    assets: [
      { id: "a1", name: "Capacité quotidienne", meta: "500 couverts / jour", status: "Disponible" },
      { id: "a2", name: "Camion frigorifique", meta: "3 tonnes", status: "Réservé" },
      { id: "a3", name: "Barnum + 20 tables", meta: "200 places assises", status: "Disponible" },
    ],
  },
  securite: {
    kind: "securite", company: "Garde Atlantique Sécurité", owner: "Colonel (ER) Diatta", icon: Shield, label: "Sécurité", unit: "agent / jour",
    resourcesLabel: "Agents & équipes", assetsLabel: "Équipements", kpiLabel: "Agents déployés", calendarLabel: "Planning des équipes",
    services: [
      { id: "o1", name: "Agent de sécurité événementiel", price: 20000, unit: "agent / jour", active: true, detail: "8 h, formé SSIAP" },
      { id: "o2", name: "Chef d’équipe", price: 35000, unit: "jour", active: true, detail: "1 pour 10 agents" },
      { id: "o3", name: "Contrôle d’accès + palpation", price: 25000, unit: "agent / jour", active: true, detail: "Avec détecteurs" },
    ],
    people: [
      { id: "h1", name: "Équipe Alpha (8 agents)", role: "Chef : Ansou Badji", status: "En mission" },
      { id: "h2", name: "Équipe Bravo (6 agents)", role: "Chef : Yacine Mané", status: "Disponible" },
      { id: "h3", name: "Équipe Charlie (10 agents)", role: "Chef : Ismaïla Coly", status: "Repos" },
    ],
    assets: [
      { id: "a1", name: "Détecteurs manuels", meta: "24 unités", status: "Disponible" },
      { id: "a2", name: "Talkies-walkies", meta: "30 unités", status: "Réservé" },
      { id: "a3", name: "Barrières Vauban", meta: "120 m", status: "Disponible" },
    ],
  },
  medical: {
    kind: "medical", company: "SOS Secours Sport", owner: "Dr Aïda Sène", icon: Ambulance, label: "Assistance médicale", unit: "demi-journée",
    resourcesLabel: "Équipe médicale", assetsLabel: "Ambulances & matériel", kpiLabel: "Couvertures ce mois", calendarLabel: "Planning des couvertures",
    services: [
      { id: "o1", name: "Ambulance + médecin + 2 secouristes", price: 120000, unit: "demi-journée", active: true, detail: "DAE inclus" },
      { id: "o2", name: "Poste de secours fixe", price: 75000, unit: "demi-journée", active: true, detail: "2 secouristes" },
    ],
    people: [
      { id: "h1", name: "Dr Aïda Sène", role: "Médecin urgentiste", status: "Disponible" },
      { id: "h2", name: "Babacar Diouf", role: "Secouriste", status: "En mission" },
    ],
    assets: [
      { id: "a1", name: "Ambulance type B · DK-4455", meta: "Révision OK", status: "Disponible" },
      { id: "a2", name: "Défibrillateurs", meta: "4 unités", status: "Disponible" },
    ],
  },
};

export interface BizRequest {
  id: string;
  client: string;
  event: string;
  date: string;
  detail: string;
  amount: number;
  status: "Nouvelle" | "Devis envoyé" | "Acceptée" | "Refusée";
  urgency?: boolean;
}

export const requestsFor = (k: BizKind): BizRequest[] => {
  const d: Record<BizKind, string[]> = {
    stade: ["Terrain A · 19:00–21:00", "3 terrains · 08:00–16:00 (tournoi)", "Terrain C · 18:00–19:30", "Terrain B · 20:00–21:00"],
    arbitre: ["Arbitre central · 4 matchs futsal", "Trio arbitral · finale", "2 matchs foot à 7", "Arbitrage 8 matchs poules"],
    transport: ["2 cars 30 pl. · Parcelles → Yoff A/R", "Minibus 15 pl. · Plateau → Almadies", "Journée complète · 1 car", "3 trajets navette aéroport"],
    traiteur: ["160 menus Thiéboudienne × 2 jours", "80 box sportives", "200 ravitaillements", "50 menus Yassa"],
    securite: ["8 agents × 2 jours + 1 chef", "4 agents contrôle d’accès", "12 agents finale", "2 agents soirée"],
    medical: ["Ambulance + médecin × 4 demi-journées", "Poste de secours × 2 demi-journées", "Couverture semi-marathon", "Poste de secours tournoi U15"],
  };
  const base = profiles[k].services[0].price;
  return [
    { id: "r1", client: "Aminata Sow · Dakar Sport Ensemble", event: "Tournoi Inter-Quartiers", date: "12–13 déc.", detail: d[k][0], amount: base * 12, status: "Nouvelle", urgency: true },
    { id: "r2", client: "Corporate Cup Plateau", event: "Corporate Cup", date: "24 janv.", detail: d[k][1], amount: base * 6, status: "Nouvelle" },
    { id: "r3", client: "Moussa Diop", event: "Five du mardi", date: "Aujourd’hui", detail: d[k][2], amount: base * 2, status: "Devis envoyé" },
    { id: "r4", client: "Lycée Seydina Limamou (fictif)", event: "Journée sportive", date: "5 déc.", detail: d[k][3], amount: base * 4, status: "Acceptée" },
  ];
};
