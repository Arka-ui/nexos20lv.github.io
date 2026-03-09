# ✨ Modern Portfolio — Pierre Bouteman

![Static](https://img.shields.io/badge/Site-Statique-7c3aed?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-0ea5e9?style=for-the-badge)
![i18n](https://img.shields.io/badge/Langues-FR%20%2F%20EN-22c55e?style=for-the-badge)

Portfolio personnel ultra-moderne avec identité visuelle futuriste, intégration temps réel (GitHub & Discord) et système de gestion dynamique.

## 🚀 Features

- **Terminal Loader** : Animation de chargement immersive simulant un scan système.
- **High Performance Mode** : Optimisation pour les anciens PCs (désactive le mesh background et les animations lourdes).
- **Ctrl+K Search** : Recherche rapide de projets par titre ou technologie.
- **GitHub Stats Live** : Affichage en temps réel des statistiques globales et par projet (stars, forks).
- **Discord Sync System** : Synchronisation dynamique de la disponibilité via un salon Discord privé.
- **Contact Form Securisé** : Envoi de messages via Webhook Discord avec injection de secrets via GitHub Actions.
- **Identité Vectorielle** : Logo SVG haute résolution et favicon assorti.

## 🧱 Stack technique

- **HTML5 & CSS3** (Vanilla, Glassmorphism, CSS Variables)
- **JavaScript ES Modules** (Pas de framework)
- **Lanyard API** (Statut Discord en temps réel via WebSocket)
- **GitHub API** (Statistiques des repositories)
- **GitHub Actions** (Déploiement auto & Injection de secrets)

## 📂 Architecture

```text
modern-portfolio/
├── .github/workflows/      # Automatisations GitHub
├── assets/                 # Logo SVG, Favicon, Images
├── css/
│   ├── base.css            # Thème, variables, reset
│   └── components.css      # Logique visuelle des composants
└── js/
    ├── app.js              # Logique métier & UI
    ├── i18n.js             # Internationalisation (FR/EN)
    ├── config.js           # Configuration injectée au déploiement
    └── status.json         # État de disponibilité (mis à jour via Discord)
```

## ⚙️ Configuration & Secrets

Pour faire fonctionner les fonctionnalités dynamiques, vous devez configurer les **Secrets** dans votre repo GitHub :

| Secret | Description |
| :--- | :--- |
| `DISCORD_WEBHOOK` | L'URL du webhook de votre salon de contact. |
| `DISCORD_BOT_TOKEN` | Token d'un bot Discord pour lire votre statut. |
| `DISCORD_STATUS_CHANNEL_ID` | L'ID du salon Discord utilisé pour la synchro. |

> [!IMPORTANT]
> N'oubliez pas d'activer les **"Workflow permissions"** sur **Read and write** dans les paramètres de votre repo (Actions > General) pour que la synchro automatique puisse fonctionner.

## 🚢 Déploiement

Le site est conçu pour être déployé via **GitHub Pages**. Le workflow `.github/workflows/static.yml` gère automatiquement :
1. Le cache-busting par versioning.
2. L'injection sécurisée du Webhook dans `js/config.js`.

## 📄 Licence

© 2026 Pierre Bouteman. Tous droits réservés.
