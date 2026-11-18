# Phase 4B — Application mobile Flutter (bêta, Android)

> Même API, mêmes comptes, mêmes règles que le web. Code : `mobile/`.

## 1. Ce qui est livré

| Écran | Fonctions |
|---|---|
| **Terrains** | Terrains à proximité (géolocalisation, à défaut Dakar Plateau), filtres sport et rayon, choix du terrain, du jour, de la durée, réservation de démonstration (aucun paiement) |
| **Matchs** | Matchs ouverts, progression des inscriptions, création (terrain, date, heure, durée, joueurs, niveau), inscription, accès au chat du match |
| **Tournois** | Liste, détail, inscription d'équipe, tableau tour par tour (exemptions, scores, champion) |
| **Chat** | Conversations de mes matchs, historique, **réception en temps réel (WebSocket)**, envoi |
| **Profil** | Mes réservations (annulation), notifications, déconnexion |

Sécurité : connexion Keycloak dans le navigateur du système (OpenID Connect + **PKCE**, client public
`sportmatch-mobile`, aucun secret dans l'application) ; jeton d'accès en mémoire, jeton de rafraîchissement
chiffré (Keystore Android) ; HTTPS obligatoire hors environnement local (`network_security_config`).

## 2. Validé par la CI (`mobile-ci`)

- `flutter analyze` et **tests unitaires et widget** : client API (requêtes, jeton, erreurs RFC 9457, 401, réseau coupé),
  formats (FCFA, heures de Dakar, noms des tours), écrans (terrains, matchs, invitation à se connecter), lecture du jeton.
- **APK Android release** construit à chaque push (artefact `sportmatch-beta-local-apk`, ~25 Mo),
  configuré pour l'émulateur et l'environnement local.

## 3. Essayer sur un émulateur Android

1. Démarrer l'environnement local (`make up` ou `sportmatch-launch.bat`).
2. Récupérer l'APK : GitHub → **Actions** → `mobile-ci` → dernier run vert → artefact **sportmatch-beta-local-apk**.
3. L'installer sur un émulateur Android (Android Studio → Device Manager) par glisser-déposer.
   L'émulateur joint le poste via `10.0.2.2` : API sur `10.0.2.2:8080`, Keycloak sur `10.0.2.2:8180`.
4. Se connecter avec `awa.player` / `demo1234`.

Développement avec rechargement à chaud :

```bash
cd mobile
bash tool/prepare_android.sh     # une fois : génère et configure android/
flutter run                      # émulateur ; téléphone sur le même Wi-Fi :
# flutter run --dart-define=API_URL=http://<ip-du-poste>:8080 --dart-define=KEYCLOAK_URL=http://<ip-du-poste>:8180
```

Sur un vrai téléphone, l'adresse IP du poste doit aussi être ajoutée à `network_security_config.xml`
(HTTP en clair) ; en staging et en production, tout passe en HTTPS.

## 4. Test fermé Google Play

Le job `distribute` de `mobile-ci` publie un Android App Bundle signé sur la piste **internal** à chaque push sur `develop`, dès que :

| Type | Nom | Contenu |
|---|---|---|
| Secret | `ANDROID_KEYSTORE_BASE64` | clé d'envoi (`keytool -genkey …`), encodée en base64 |
| Secret | `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, `ANDROID_KEY_ALIAS` | mots de passe et alias de la clé |
| Secret | `PLAY_SERVICE_ACCOUNT_JSON` | compte de service Google Play Console (rôle « Release manager ») |
| Variable | `MOBILE_API_URL`, `MOBILE_KEYCLOAK_URL` | URL HTTPS du staging |

Prérequis Play Console : compte développeur (25 $ une fois), application `com.sportmatch.app` créée,
un premier envoi manuel de l'AAB, fiche de confidentialité et formulaire « sécurité des données » remplis,
liste de testeurs (adresses Gmail) sur la piste interne.

## 5. Limites connues de la bêta mobile

- **Notifications push** (FCM) pas encore branchées : elles demandent un projet Firebase (`google-services.json`).
  En attendant, les notifications sont visibles dans l'onglet Profil.
- **iOS** : le code est compatible, mais le projet iOS, la signature et TestFlight demandent un Mac et un compte Apple Developer (99 $/an).
- Création et gestion des tournois : depuis le web (l'app permet de consulter et d'inscrire une équipe).
