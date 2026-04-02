# Alliance Admin

Application de bureau locale (Tauri v2 + React + PocketBase) pour la gestion des situations ASE, du planning et de la facturation.

> **Données 100 % locales.** Le dossier `backend/pb_data/` n'est jamais envoyé sur Git.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Bureau | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS v4 + Shadcn/UI |
| Base de données | PocketBase (SQLite local, port `8090`) |
| PDF | @react-pdf/renderer |
| Calendrier | FullCalendar (React) |

---

## Prérequis

- [Node.js](https://nodejs.org/) ≥ 20
- [Rust](https://rustup.rs/) (pour Tauri)
- `backend/pocketbase.exe` présent (déjà versionné)

---

## Lancer l'environnement de développement

**Deux terminaux sont nécessaires.**

### Terminal 1 — PocketBase (base de données locale)

```powershell
cd backend
.\pocketbase.exe serve
```

L'interface admin est disponible sur : [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/)

Les **collections** (settings, financeurs, act_types…) sont créées automatiquement via les migrations dans `backend/pb_migrations/`.

> Première fois : créer un compte administrateur :
>
> ```powershell
> .\pocketbase.exe superuser upsert admin@alliance.local Admin12345678!
> ```
>
> Identifiants dev par défaut : `admin@alliance.local` / `Admin12345678!`

### Terminal 2 — Application Tauri + React

```powershell
npm run tauri dev
```

---

## Variables d'environnement (optionnel)

Créer un fichier `.env` à la racine pour surcharger l'URL PocketBase :

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

Par défaut, l'app pointe déjà sur `http://127.0.0.1:8090`.

---

## Structure du projet

```
alliance-admin/
├── backend/
│   ├── pocketbase.exe       # binaire PocketBase (versionné)
│   ├── pb_migrations/       # schéma des collections (versionné)
│   └── pb_data/             # données SQLite locales (ignoré par Git)
├── src/                     # frontend React / TypeScript
│   └── lib/pocketbase.ts    # client PocketBase partagé
└── src-tauri/               # backend Rust / config Tauri
```

---

## Synchronisation entre machines

Placer le dossier `backend/pb_data/` dans un dossier cloud de fichiers (OneDrive, Google Drive…). L'application lit et écrit **uniquement en local** via le binaire PocketBase.
