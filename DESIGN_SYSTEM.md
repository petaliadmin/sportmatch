# SportMatch — Design System v0.1

> **SportTech Premium.** Sombre par défaut, lime électrique réservé à l'action.
> Une seule source de vérité pour les 4 espaces : App (sportifs), Events (organisateurs), Business (prestataires), Admin (back-office).
> Page vivante : route `#design-system` du prototype.

---

## 1. Principes

| Principe | Traduction concrète |
|---|---|
| **Confiance immédiate** | Badge « Vérifié », note + nombre d'avis, prix toujours affichés TTC avec l'unité, mention « simulation » sur tout paiement. |
| **L'action est lime, le reste est calme** | `primary` (#B7F34A) est réservé au CTA principal, à l'état sélectionné et aux données clés. Jamais pour du texte courant ni pour une décoration. |
| **Données d'abord** | Chiffres en `tabular-nums`, montants insécables (`fcfa()`), graphiques sobres sans grille lourde. |
| **Simple pour le débutant, complet pour le pro** | Mobile : 1 action principale par écran, sticky en bas. Console : tables triables, drawers de détail, filtres persistants. |
| **Pas de gadgets** | Pas de glassmorphism, pas de dégradés décoratifs. Les seuls dégradés : voile photo→fond et remplissage d'aire des graphiques. |

---

## 2. Tokens

Les couleurs sont des **variables CSS en triplets RGB** (`src/app/globals.css`), exposées à Tailwind via `rgb(var(--x) / <alpha-value>)` (`tailwind.config.ts`). Le thème clair = retirer la classe `.dark` de `<html>`. Aucun composant ne contient de couleur en dur (hors illustrations et séries de graphiques).

### Couleurs

| Token | Sombre (défaut) | Clair | Usage |
|---|---|---|---|
| `bg` | `#101A17` | `#F6F8F5` | Fond de page |
| `surface` | `#182420` | `#FFFFFF` | Cartes, panneaux, inputs |
| `surface-2` | `#202D28` | `#EEF2EC` | Secondaire : fonds de pastilles, hover, skeleton |
| `border` | `#2C3B35` | `#DEE4DC` | Bordures 1 px |
| `fg` | `#FFFFFF` | `#101A17` | Texte principal |
| `muted` | `#89958E` | `#5F6B64` | Texte secondaire, légendes |
| `primary` | `#B7F34A` | `#B7F34A` | CTA, sélection, focus ring |
| `primary-fg` | `#101A17` | `#101A17` | Texte **sur** lime (contraste 13:1) |
| `primary-ink` | `#B7F34A` | `#4D7C0F` | Texte « lime » lisible (liens, eyebrows) — sur fond clair le lime pur échoue en contraste |
| `success` | `#22C55E` | `#16A34A` | Confirmé, payé, disponible |
| `warning` | `#F59E0B` | `#D97706` | En attente, heure de pointe, risque moyen |
| `error` | `#EF4444` | `#DC2626` | Annulé, échec, dépassement de budget |
| `info` | `#60A5FA` | `#2563EB` | Notifications, statuts neutres-actifs |

Opacités d'usage : fonds teintés `/10` à `/15` (badges, sélection), bordures teintées `/30` à `/40`.

### Typographie

| Rôle | Police | Taille / interligne | Graisse |
|---|---|---|---|
| Display | Manrope | 52/56 | 800 |
| H1 page | Manrope | 30/36 (desktop) · 24/30 (mobile) | 700–800 |
| Titre de section | Manrope | 17–20 | 700 |
| Body | Inter | 15/22 | 400 |
| Small | Inter | 14/20 | 400–500 |
| Caption | Inter | 12/16 · 11/14 (`2xs`) | 500–600 |

- `font-display` = Manrope (titres, chiffres clés) ; `font-sans` = Inter (tout le reste).
- Chiffres : classe `.tabular` sur tout montant, compteur ou colonne numérique.
- Eyebrow : 12 px, uppercase, `tracking-widest`, `text-primary-ink`.

### Espacements

Échelle Tailwind (base 4 px). Usage :
- **4 / 8** : intra-composant (icône ↔ label).
- **12 / 16** : padding de carte (`p-3` mobile dense, `p-4` standard, `p-5` console).
- **20 / 24** : gouttière d'écran (`px-5` mobile, `px-8` console) et écart entre blocs (`gap-6`).
- **32 / 40** : séparation de sections.

### Rayons

| Token | Valeur | Usage |
|---|---|---|
| `sm` | 6 px | Petits contrôles, kbd |
| `md` (défaut) | 10 px | Boutons, inputs, tuiles |
| `lg` | 14 px | Cartes |
| `xl` | 18 px | Modals desktop |
| `2xl` | 24 px | Bottom sheets, tuiles d'action mobile |
| `full` | — | Chips, badges, avatars |

### Ombres

| Token | Usage |
|---|---|
| `shadow-card` | Hover des cartes interactives uniquement (les cartes au repos n'ont qu'une bordure) |
| `shadow-pop` | Modals, drawers, menus, toasts, marqueurs de carte |
| `shadow-ring` | Focus des champs |

### Breakpoints

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`

- **< 1024** : l'app sportive est plein écran ; les consoles passent en menu tiroir.
- **≥ 1024** : l'app sportive s'affiche dans un cadre téléphone 390×844 avec un rail « parcours guidé » ; les consoles affichent la sidebar fixe (260 px).

### Mouvement

| Animation | Durée | Courbe | Usage |
|---|---|---|---|
| `fade-up` | 280 ms | `cubic-bezier(.2,.8,.2,1)` | Entrée d'écran, cartes, toasts |
| `slide-in` | 280 ms | idem | Drawers |
| `slide-up` | 280 ms | idem | Bottom sheets (mobile) |
| `shimmer` | 1,4 s ∞ | linear | Skeletons |
| Pressed | 150 ms | — | `active:scale-[.98]` sur tous les boutons |

`prefers-reduced-motion` neutralise toutes les animations.

---

## 3. Composants (`src/components/ui`)

| Composant | Variantes / props clés | Notes |
|---|---|---|
| `Button` | `primary · secondary · outline · ghost · danger · link` × `sm · md · lg · icon · icon-sm`, `loading`, `block` | Un seul `primary` par zone visuelle. `loading` désactive et affiche un spinner. |
| `Input` | `icon`, `aria-invalid` | L'état erreur est piloté par `aria-invalid` (bordure `error`). |
| `Field` | `label`, `hint`, `error` | Enveloppe label + aide/erreur ; erreur annoncée `role="alert"`. |
| `Select`, `Textarea` | natifs stylés | Natifs = accessibles et mobiles-friendly. |
| `Switch`, `Checkbox`, `Stepper` | — | `role="switch"` + `aria-checked`. |
| `Segmented` | `sm · md` | `role="radiogroup"`, choix exclusif court (2–4 options). |
| `Chip` | `active`, `icon` | Filtres toggle, `aria-pressed`. |
| `DateStrip` | — | Date picker mobile horizontal (14 jours). |
| `SlotGrid` | slots `free · peak · booked` | Time picker ; sélection multiple contiguë gérée par l'écran. |
| `MonthCalendar` | `marks: free · busy · full` | Calendrier de disponibilité, lundi en premier. |
| `Card` | `interactive` | Hover : lift 2 px + `shadow-card`. |
| `Badge` | `neutral · primary · success · warning · error · info · outline`, `dot` | Statuts. Toujours texte + couleur (jamais couleur seule). |
| `Verified`, `Rating` | — | Signaux de confiance standardisés. |
| `Avatar`, `AvatarStack` | `size`, `ring` | Initiales colorées déterministes (pas de photos de personnes). |
| `Progress`, `ScoreRing` | tones | Remplissage, budget, fiabilité / compatibilité (≥85 lime, ≥70 orange, sinon rouge). |
| `Stat` | `delta`, `hint`, `icon` | Tuile KPI. |
| `Tabs` | `count` | `role="tablist"`, scroll horizontal sur mobile. |
| `Menu` | `items[]`, `danger` | Dropdown léger (`<details>`). |
| `Modal` | `sm · md · lg`, `footer` | Centré desktop / bottom-sheet mobile, Échap + clic fond, focus initial. |
| `Drawer` | `width` | Détails, filtres, affectations. |
| `DataTable` | `columns[].sort`, `onRowClick`, `empty` | Tri au clic d'en-tête, scroll horizontal < 640 px. |
| `Skeleton`, `CardSkeleton` | — | État de chargement. |
| `EmptyState` | `icon`, `action` | Toujours avec une action de sortie. |
| `ErrorState` | `onRetry` | `role="alert"`. |
| Toasts (`useStore().toast`) | `success · error · info` | 3 max, auto-dismiss 3,8 s, `aria-live="polite"`. |

Composants visuels (`src/components/visual`) :
- `SportVisual` — illustration SVG par sport (remplace les photos dans le sandbox, cf. AI_CONTEXT).
- `DakarMap` — carte vectorielle schématique ; même API qu'un futur adaptateur Mapbox (`points`, `selectedId`, `onSelect`).

Shells (`src/components/shells`) : `MobileShell` + `MobileHeader`, `ConsoleShell` + `PageHeader`, `Toaster`, `Logo`, `DemoBadge`, `ThemeToggle`.

---

## 4. États interactifs

| État | Règle |
|---|---|
| Hover | Fond `surface-2` (ghost/outline), luminosité −5 % (primary), bordure `muted` (cartes) |
| Focus | Anneau 2 px `primary` + offset 2 px (`:focus-visible`) ; champs : bordure `primary` + `shadow-ring` |
| Pressed | `scale(.98)` |
| Sélectionné | Fond `primary` + texte `primary-fg` (chips, jours) ou bordure `primary` + fond `primary/10` (cartes options) |
| Désactivé | Opacité 50 %, `pointer-events: none` ; créneau réservé : barré |
| Chargement | Spinner dans le bouton, skeleton pour les listes, scanning animé (Smart Fill) |
| Erreur | Bordure `error`, message sous le champ, `ErrorState` pour une liste |

---

## 5. Patterns métier

- **Montants** : toujours `fcfa(n)` (espaces insécables, ne se coupent jamais). Unité affichée : `/h`, `/ joueur`, `/ agent / jour`.
- **Statuts** : Confirmée/Payé → `success` · En attente/Devis envoyé → `warning` · Annulée/Échoué → `error` · Nouvelle → `info` · Brouillon → `neutral`.
- **Paiement** : 3 modes visuellement équivalents (partagé, acompte 30 %, intégral) sous forme de radios-cartes ; le montant « à payer maintenant » est répété au-dessus du CTA.
- **Booking Engine** : le formulaire de configuration change selon la catégorie (créneau / trajet / mission / agents / menu / couverture) mais garde la même structure : champs métier → quantité × jours → estimation live.
- **Score** : fiabilité et compatibilité partagent `ScoreRing` et les mêmes seuils.

---

## 6. Accessibilité (socle)

- Contraste AA vérifié pour `fg/bg`, `muted/bg` (sombre 5,7:1, clair 5,2:1), `primary-fg/primary` (13:1). Sur fond clair, le lime n'est **jamais** utilisé comme couleur de texte (→ `primary-ink`).
- Tous les boutons-icônes ont un `aria-label` ; navigation principale `aria-current="page"`.
- Rôles ARIA : `dialog`/`aria-modal`, `tablist`/`tab`, `radiogroup`/`radio`, `switch`, `progressbar`, `listbox`/`option` (DateStrip).
- Formulaires : `aria-invalid` + message `role="alert"` (React Hook Form + Zod).
- Statut jamais porté par la couleur seule (texte + point).
- Cibles tactiles ≥ 40 px sur mobile.

---

## 7. Correspondance Flutter

| Web (Tailwind) | Flutter |
|---|---|
| CSS vars `--bg…` | `ThemeExtension<SportMatchColors>` (dark/light) |
| `font-display` / `font-sans` | `TextTheme` : Manrope pour `display*/headline*/title*`, Inter pour `body*/label*` |
| `rounded-md/lg/2xl` | `BorderRadius.circular(10/14/24)` |
| `animate-fade-up` 280 ms | `Curves.easeOutCubic`, 280 ms |
| `Modal` (mobile) | `showModalBottomSheet` |
| `DateStrip` / `SlotGrid` | `ListView.horizontal` / `Wrap` de `ChoiceChip` |
