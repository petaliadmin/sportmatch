# SPORTMATCH — Prototype UX/UI

**Find your game. Book your sport. Manage your events.**

Prototype interactif de la plateforme SportMatch (ville pilote : Dakar). 4 espaces, environ 80 écrans, données fictives, aucun paiement ni aucune réservation réels.

| Espace | Pour qui | Point d'entrée |
|---|---|---|
| SportMatch App | Sportifs (mobile) | `#app-splash` |
| SportMatch Events | Organisateurs | `#events-dashboard` |
| SportMatch Business | Prestataires | `#business-dashboard` |
| SportMatch Admin | Back-office | `#admin-dashboard` |
| Design system | Équipe produit | `#design-system` |

## Lancer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # export statique dans out/
npm run typecheck
```

## Parcours principal à tester

1. **Découvrir un terrain** : Explorer → carte → « Voir les créneaux »
2. **Réserver** : choisir un jour et des créneaux consécutifs → options → paiement partagé → confirmation
3. **Créer un match** sur ce créneau → publier
4. **Smart Fill** : inviter les meilleurs joueurs compatibles
5. **Événement** : Event Planner → « Générer ma sélection » → panier → devis → budget

Documentation : [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [AI_CONTEXT.md](./AI_CONTEXT.md)
