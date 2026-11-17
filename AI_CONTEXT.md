# AI_CONTEXT — SportMatch web prototype

Contexte pour toute personne ou IA qui reprend ce code. À lire avant de modifier.

## Ce qu'est ce repo

Un **prototype interactif front-only** de SportMatch (marketplace sportive, ville pilote Dakar). Les 4 espaces, environ 80 écrans, sur données fictives et services mockés. **Aucun backend, aucun paiement réel, aucune réservation réelle.**

- Stack : Next.js 15 (App Router, `output: "export"`), React 19, TypeScript strict, Tailwind 3, Lucide, Recharts, React Hook Form + Zod.
- Build statique : `npm run build` → `out/` (s'ouvre depuis n'importe quel dossier, `assetPrefix: "./"`).
- Dev : `npm run dev` → http://localhost:3000

## Décisions structurantes (et pourquoi)

| Décision | Raison | À faire en production |
|---|---|---|
| **Routeur client à hash plat** (`src/lib/router.tsx`, routes `app-venue`, `events-cart`…) | Le prototype est publié dans un sandbox qui ne transmet qu'un `#nom` simple ; un seul `index.html` exporté. | Chaque nom de route = un segment App Router (`app-venue` → `app/(app)/venues/[id]/page.tsx`). Les écrans sont déjà des composants isolés : migration mécanique. Remplacer `useRouter().params` par `useParams/useSearchParams`. |
| **Store React Context unique** (`src/lib/store.tsx`) | Partage d'état entre espaces (le panier Events est alimenté depuis l'App, les notifications sont globales). | Remplacer par TanStack Query (données serveur) + Zustand (UI). `mockRequest()` montre où brancher l'API. |
| **Composants maison « shadcn-like »** au lieu du CLI shadcn | Registre shadcn inaccessible dans l'environnement de génération ; API volontairement proche. | Possible de migrer vers shadcn/ui + Radix sans changer les écrans (mêmes noms : Button, Badge, Tabs, Drawer…). |
| **`SportVisual` (SVG) au lieu de photos** | Le sandbox bloque les images distantes ; pas de photos de personnes réelles. | Remplacer par `next/image` + CDN média. Les emplacements et ratios sont déjà définis. |
| **`DakarMap` schématique** au lieu de Mapbox | Pas de token / réseau. | Adaptateur `MapView` Mapbox GL avec la même API (`points`, `selectedId`, `onSelect`). Coordonnées réelles à ajouter dans `venues.ts`. |
| **App sportive en web** dans un cadre téléphone | Valider les parcours avant Flutter. | Référence visuelle et comportementale pour l'app Flutter (cf. table de correspondance dans DESIGN_SYSTEM.md). |
| **FR par défaut, `t()` minimal** (`src/lib/i18n.ts`) | Pilote Dakar francophone. | Extraire les chaînes avec next-intl (FR/EN, Wolof à évaluer). Devise via `Intl` déjà isolée dans `fcfa()`. |

## Arborescence

```
src/
  app/                 layout (polices, thème), page → <Prototype/>
  lib/                 router, store (+ mockRequest, cartLineTotal), utils (cn, fcfa, dates), i18n
  data/                types.ts + données fictives : venues, players (+ compatibility()), matches, providers (+ categories), misc
  components/
    ui/                design system (cf. DESIGN_SYSTEM.md)
    visual/            SportVisual, DakarMap
    shells/            MobileShell, ConsoleShell, Toaster, brand
  features/
    prototype.tsx      aiguillage route → espace
    hub/               page d'accueil du prototype
    app/               27 écrans sportifs (onboarding, home, explore, booking, matches, people)
    events/            18 écrans organisateur (planner, marketplace + Booking Engine, ops)
    business/          16 écrans prestataire, adaptés par métier (profiles.ts)
    admin/             15 écrans back-office
    design-system/     page de référence vivante
```

## Logique métier simulée

- **Compatibilité Smart Fill** (`data/players.ts › compatibility`) : disponibilité 30 % · distance 25 % · niveau 20 % · sport/poste 15 % · fiabilité 10 % (pondérations du cahier des charges). Scoring classique, pas d'IA.
- **Créneaux** (`booking.tsx › slotsFor`) : déterministes par terrain/jour/court ; heures 18–21 h majorées de 20 % ; heures passées du jour bloquées ; sélection forcément contiguë.
- **Paiement** : partagé (total ÷ joueurs), acompte 30 %, intégral ; frais de service 3 % (terrain) / 5 % (événement) ; échec simulable.
- **Event Planner** (`planner.tsx › plannedQty`) : arbitres = nb de matchs, agents ≈ 1 pour 40 personnes, transport = 2 trajets par tranche de 30, restauration = participants ; choisit le prestataire vérifié le mieux noté, alternatives en 1 clic ; alerte de dépassement de budget.
- **Devis** : « demandé » → « reçu » après un délai simulé, prix devis = catalogue ± remise.
- **Business** : `profiles.ts` décrit 6 métiers (stade, arbitre, transport, traiteur, sécurité, médical) ; tous les écrans lisent le profil actif → libellés, ressources, actifs, unités et KPI changent.

## Règles à respecter

1. **Données clairement fictives** : suffixe « (fictif) » sur les noms ambigus, badge « Démo · données fictives » visible dans chaque shell.
2. **Jamais de paiement ou réservation réels** : tout CTA de paiement mentionne la simulation.
3. **Aucun bouton décoratif** : chaque bouton navigue, modifie l'état ou affiche un toast explicite (« simulé »).
4. **Tokens uniquement** : pas de couleur en dur dans les composants (exceptions : séries de graphiques, illustrations).
5. **Montants via `fcfa()`**, nombres en `.tabular`.
6. Nouvel écran : composant dans `features/<espace>/`, entrée dans la table de routes de l'espace, lien depuis la navigation.

## Couverture vs cahier des charges

- ✅ 4 espaces, navigation complète, parcours principal de bout en bout (terrain → créneau → paiement → création de match → Smart Fill → services d'événement).
- ✅ Smart Fill, Event Planner, Service Marketplace (filtres, recherche, géoloc simulée, tarifs, dispo, notes, vérification, comparaison), Booking Engine par type de service, Payment Experience (intégral, acompte, partagé, suivi, factures, historique).
- ✅ Thème sombre/clair, responsive 390 → 1440 px, états chargement/vide/erreur, toasts et notifications simulés.
- ⚠️ Pas encore faits : app Flutter, i18n complète, vraie carte, vraies photos, tests automatisés (le QA a été fait par script Playwright, non versionné), audit d'accessibilité complet.

## Vérifications effectuées

- `tsc --noEmit` et `next build` sans erreur.
- 78 routes rendues en 390×844 et 1440×900 : zéro erreur JS.
- Parcours cliqués de bout en bout : réservation (61 800 FCFA calculés), création de match à la bonne date, Smart Fill jusqu'à 10/10, Event Planner → panier (ajout/suppression) → 4 devis reçus → validation → budget mis à jour, bascule clair/sombre.
