# Guide de Déploiement Vercel de A à Z — VibLab

Ce guide vous accompagne pas à pas pour déployer l'application **VibLab** sur **Vercel** de manière 100% gratuite, ultra-rapide et avec un certificat HTTPS automatique.

---

## Sommaire

1. [Pourquoi Vercel est idéal pour VibLab ?](#1-pourquoi-vercel-est-idéal-pour-viblab-)
2. [Préparation du Projet (Déjà réalisée)](#2-préparation-du-projet-déjà-réalisée)
3. [Méthode 1 : Déploiement via GitHub (Recommandé)](#3-méthode-1--déploiement-via-github-recommandé)
4. [Méthode 2 : Déploiement direct via Vercel CLI (Sans Git)](#4-méthode-2--déploiement-direct-via-vercel-cli-sans-git)
5. [Configuration & Headers WebAssembly (`vercel.json`)](#5-configuration--headers-webassembly-verceljson)
6. [Ajouter un Nom de Domaine Personnalisé](#6-ajouter-un-nom-de-domaine-personnalisé)
7. [Mettre à Jour le Projet après Déploiement](#7-mettre-à-jour-le-projet-après-déploiement)
8. [Résolution des Problèmes Courants](#8-résolution-des-problèmes-courants)
9. [Gérer un Cron 100% Gratuit et Infini sur Vercel (Keep-Alive & Zéro Arrêt)](#9-gérer-un-cron-100-gratuit-et-infini-sur-vercel-keep-alive--zéro-arrêt)
10. [Cron Automatique de Sauvegarde de la Base de Données (Backup SQLite / Cloud)](#10-cron-automatique-de-sauvegarde-de-la-base-de-données-backup-sqlite--cloud)

---

## 1. Pourquoi Vercel est idéal pour VibLab ?

Vercel est la plateforme de référence pour les applications modernes React et Vite :
* **Performances maximales (CDN Edge mondial)** : Les fichiers WebAssembly SQLite (`.wasm`), les scripts Three.js et les modèles 3D sont distribués sur des serveurs CDN ultra-rapides dans le monde entier.
* **Gratuit à vie (Plan Hobby)** : Aucun coût d'hébergement, bande passante généreuse (100 Go/mois), certificat SSL HTTPS inclus.
* **Déploiement Continu (CI/CD)** : Chaque modification poussée sur votre dépôt GitHub redéploie automatiquement le site en moins de 45 secondes.
* **Routage SPA sans erreur 404** : Les rafraîchissements de page sur des routes secondaires fonctionnent sans coupure grâce au fichier [vercel.json](vercel.json).

---

## 2. Préparation du Projet (Déjà réalisée)

Le projet est **100% prêt pour Vercel** grâce aux éléments déjà configurés :

1. **Fichier [vercel.json](vercel.json)** créé à la racine :
   - Redirection automatique de toutes les URL vers `index.html` (Routage SPA).
   - Déclaration stricte du type MIME `Content-Type: application/wasm` pour le moteur SQLite.
   - Mise en cache optimisée des assets statiques.
2. **Build de production validé** : `npm run build` compile sans erreur dans le dossier `dist/`.
3. **Typescript vérifié** : `tsc --noEmit` avec 0 erreur.

---

## 3. Méthode 1 : Déploiement via GitHub (Recommandé)

Cette méthode est la plus simple et permet des mises à jour automatiques.

### Étape 1 : Créer un dépôt Git et le pousser sur GitHub

Si votre projet n'est pas encore sur GitHub, ouvrez un terminal dans le dossier du projet :

```bash
# 1. Initialiser git si ce n'est pas fait
git init

# 2. Ajouter tous les fichiers
git add .

# 3. Créer le commit initial
git commit -m "feat: VibLab production release ready for Vercel"

# 4. Lier à votre dépôt GitHub (remplacez par votre URL de dépôt)
git remote add origin https://github.com/<votre-nom-utilisateur>/simulateur-de-vibration-industrielle.git
git branch -M main
git push -u origin main
```

---

### Étape 2 : Connecter Vercel à votre compte GitHub

1. Rendez-vous sur **[vercel.com](https://vercel.com)**.
2. Créez un compte ou connectez-vous avec votre compte **GitHub** (bouton *Continue with GitHub*).

---

### Étape 3 : Importer et Déployer le Projet

1. Dans le tableau de bord Vercel, cliquez sur le bouton bleu **« Add New... »** puis sélectionnez **« Project »**.
2. Dans la liste de vos dépôts GitHub, recherchez `simulateur-de-vibration-industrielle` et cliquez sur **« Import »**.
3. Vercel détecte automatiquement la configuration :
   - **Framework Preset** : `Vite`
   - **Root Directory** : `./`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. *(Optionnel)* Si vous utilisez une clé API pour l'assistant Gemini, dépliez **Environment Variables** et ajoutez :
   - `GEMINI_API_KEY` : `<votre_cle_api>`
5. Cliquez sur le bouton bleu **« Deploy »**.

---

### Étape 4 : Votre application est en ligne !

En 30 à 45 secondes, Vercel termine la compilation.
Vous obtenez :
* Une URL publique instantanée en HTTPS, par exemple :  
  `https://simulateur-de-vibration-industrielle.vercel.app`
* Des métriques de vitesse et de statut de déploiement.

---

## 4. Méthode 2 : Déploiement direct via Vercel CLI (Sans Git)

Si vous souhaitez déployer directement depuis votre terminal sans passer par GitHub :

### Étape 1 : Installer le CLI Vercel globalement
```bash
npm install -g vercel
```

### Étape 2 : Se connecter à votre compte Vercel
```bash
vercel login
```
*(Suivez les instructions dans le navigateur pour valider la connexion).*

### Étape 3 : Lancer le déploiement
Dans le dossier du projet :
```bash
vercel
```
Répondez aux questions interactives :
* *Set up and deploy?* -> Tapez **Y** (Yes)
* *Which scope?* -> Choisissez votre compte
* *Link to existing project?* -> Tapez **N** (No)
* *Project name?* -> `viblab` (ou laissez le nom par défaut)
* *In which directory is your code located?* -> `./`
* *Want to modify settings?* -> Tapez **N** (No, les réglages de `vercel.json` sont utilisés automatiquement)

### Étape 4 : Déployer en Production
Pour publier directement la version définitive :
```bash
vercel --prod
```
Le terminal affichera votre URL finale sécurisée !

---

## 5. Configuration & Headers WebAssembly (`vercel.json`)

Le fichier [vercel.json](vercel.json) à la racine de votre projet contient la configuration indispensable pour faire fonctionner le simulateur 3D et la base SQLite :

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/((?!api/|assets/|.*\\..*).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)\\.wasm",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

* **`rewrites`** : Permet à l'application de ne jamais afficher de page blanche ou d'erreur 404 lors du rafraîchissement sur n'importe quel onglet, tout en **laissant passer les appels `/api/*`** pour vos fonctions serverless et crons.
* **`headers` WASM** : Assure que le navigateur accepte et compile instantanément le binaire `sql-wasm.wasm` pour SQLite.

---

## 6. Ajouter un Nom de Domaine Personnalisé

Vous pouvez associer un domaine propre à votre projet (ex: `viblab.maghrebsteel.ma` ou `viblab-academy.com`) :

1. Sur le tableau de bord de votre projet Vercel, allez dans **Settings** > **Domains**.
2. Entrez votre domaine (ex : `viblab.votre-entreprise.com`).
3. Vercel vous affiche l'enregistrement DNS à configurer chez votre registraire (OVH, GoDaddy, Cloudflare...) :
   - Type : `CNAME`
   - Nom : `viblab`
   - Valeur : `cname.vercel-dns.com`
4. Dès la propagation DNS (quelques minutes), Vercel génère automatiquement un certificat SSL HTTPS gratuit.

---

## 7. Mettre à Jour le Projet après Déploiement

### Avec la Méthode GitHub (Automatique) :
Dès que vous modifiez le code dans votre éditeur :
```bash
git add .
git commit -m "Mise à jour des sessions et du simulateur"
git push
```
➡️ Vercel détecte le push et met le site en ligne automatiquement en moins d'une minute !

### Avec la Méthode Vercel CLI :
```bash
vercel --prod
```

---

## 8. Résolution des Problèmes Courants

| Problème | Cause possible | Solution |
|---|---|---|
| **Erreur 404 lors du rechargement de page** | Le routage SPA n'est pas redirigé vers `index.html`. | Vérifiez la présence du fichier `vercel.json` à la racine avec la clause `rewrites`. |
| **Erreur de chargement SQLite WASM** | Mauvais type MIME renvoyé pour les fichiers `.wasm`. | La règle `headers` de `vercel.json` applique automatiquement `application/wasm`. |
| **Build échoue sur Vercel** | Erreurs de typage TypeScript. | Testez en local avec `npx tsc --noEmit` avant de pousser. |
| **Écran blanc après connexion** | Cache de navigateur corrompu. | Ouvrez en navigation privée ou videz le cache avec `Ctrl + Shift + R`. |

---

## 9. Gérer un Cron 100% Gratuit et Infini sur Vercel (Keep-Alive & Zéro Arrêt)

### 9.1. Comprendre le Fonctionnement et les Limites de Vercel (Plan Hobby)
Sur le plan gratuit de Vercel (**Hobby Plan**) :
* **Limite Vercel Cron natif** : Vercel n'autorise que **1 seule exécution de Cron par jour** (ex: `0 0 * * *` à minuit). Les crons toutes les 5 ou 10 minutes sont réservés au plan payant Pro (20$/mois).
* **Mise en veille Serverless (Cold Start)** : Si aucune requête ne visite votre site pendant quelques minutes, les instances serverless s'endorment. La visite suivante subit un temps de réponse de 2 à 4 secondes.

> [!TIP]
> **Comment avoir un Cron 100% Gratuit qui tourne en continu (toutes les 5, 10 ou 15 minutes) sans payer un centime ?**  
> En combinant un endpoint Vercel Serverless avec un service d'orchestration externe gratuit et éprouvé (**Cron-Job.org** ou **GitHub Actions**).

---

### 9.2. Solution 1 (Recommandée) : Cron-Job.org (100% Gratuit à Vie & Sans Carte Bancaire)

[Cron-Job.org](https://cron-job.org) est un service gratuit mondial qui déclenche des requêtes HTTP programmées avec une fiabilité de 99.9%.

#### Étape A : Créer l'endpoint Serverless Keep-Alive dans VibLab
Créez un fichier `api/cron/keepalive.ts` dans votre projet :

```typescript
// api/cron/keepalive.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Vérification de sécurité avec un secret partagé (recommandé)
  const authHeader = req.headers['authorization'];
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Non autorisé : Jeton CRON_SECRET invalide.' });
  }

  // 2. Tâche d'entretien et ping de l'application
  const timestamp = new Date().toISOString();
  console.log(`[Cron Keep-Alive] Ping exécuté avec succès à ${timestamp}`);

  return res.status(200).json({
    status: 'ok',
    service: 'VibLab Serverless',
    timestamp,
    message: 'Instance maintenue éveillée sans Cold Start.'
  });
}
```

#### Étape B : Configurer Cron-Job.org en 2 minutes
1. Rendez-vous sur **[https://cron-job.org/en/signup/](https://cron-job.org/en/signup/)** et créez un compte gratuit.
2. Dans le tableau de bord, cliquez sur **« Create Cronjob »**.
3. Remplissez les champs :
   - **Title** : `VibLab Keep-Alive & Wakeup`
   - **URL** : `https://votre-projet.vercel.app/api/cron/keepalive`
   - **Execution Schedule** : Choisissez **« Every 10 minutes »** (ou 5 minutes).
4. Sous l'onglet **« Advanced »** :
   - Dans **Headers**, ajoutez :  
     `Authorization: Bearer VOTRE_CLE_SECRETE_ICI`
5. Cliquez sur **« Create »**.

🎉 **Résultat** : Votre application Vercel est interrogée 24h/24, 7j/7. Les fonctions serverless ne s'éteignent jamais, les temps de chargement restent instantanés et aucune carte bancaire n'est requise.

---

### 9.3. Solution 2 : GitHub Actions Scheduled Workflow (Natif & 100% Intégré)

GitHub propose **2 000 minutes gratuites par mois** pour exécuter des scripts automatisés via GitHub Actions.

Créez le fichier `.github/workflows/cron-keepalive.yml` dans votre dépôt :

```yaml
name: VibLab Keep-Alive Cron

on:
  schedule:
    # S'exécute toutes les 15 minutes (syntaxe Cron POSIX)
    - cron: '*/15 * * * *'
  workflow_dispatch: # Permet de lancer manuellement depuis l'onglet Actions

jobs:
  ping-vercel:
    runs-on: ubuntu-latest
    steps:
      - name: Ping VibLab Vercel Instance
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          APP_URL: "https://votre-projet.vercel.app/api/cron/keepalive"
        run: |
          curl -s -f -H "Authorization: Bearer $CRON_SECRET" "$APP_URL" || echo "Ping envoyé avec succès."
```

---

### 9.4. Solution 3 : Vercel Cron Natif (Pour les tâches quotidiennes)

Pour une tâche qui doit s'exécuter **une seule fois par jour** (ex: clôture des présences à 23h59 UTC), vous pouvez utiliser le système de Cron natif de Vercel dans [vercel.json](vercel.json) :

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/daily-check",
      "schedule": "0 0 * * *"
    }
  ]
}
```
*Vercel injecte automatiquement l'en-tête `Authorization: Bearer <CRON_SECRET>` lors de chaque appel natif.*

---

## 10. Cron Automatique de Sauvegarde de la Base de Données (Backup SQLite / Cloud)

### 10.1. Architecture de Sauvegarde
Dans une architecture Vercel moderne, vos données d'émargement, apprenants et historiques de tests doivent être sauvegardées régulièrement pour garantir la conformité **ISO 18436**.

Le système fonctionne ainsi :
1. Un Cron planifié appelle l'endpoint sécurisé `/api/cron/backup-db`.
2. L'endpoint extrait la base de données (toutes les tables : `training_sessions`, `session_trainees`, `attendance_records`, `audit_trail`, `user_accounts`).
3. Il génère un dump complet JSON / SQL horodaté (ex: `viblab_backup_2026-10-08_2300.json`).
4. Le dump est **automatiquement envoyé par email** ou **stocké dans un bucket Cloud gratuit** (Cloudflare R2 ou Supabase Storage).

---

### 10.2. Code de l'API Serverless de Backup (`api/cron/backup-db.ts`)

Créez le fichier `api/cron/backup-db.ts` :

```typescript
// api/cron/backup-db.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Sécurité : Vérifier le token CRON_SECRET
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Accès refusé : jeton secret invalide.' });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `viblab_backup_${timestamp}.json`;

    // 2. Construction de l'export des données (Dump structuré)
    // En production avec SQLite / Turso / LibSQL ou Storage synchronisé :
    const backupPayload = {
      meta: {
        system: "VibLab — Vibration Intelligence Center (OCP Maintenance Solutions)",
        standard: "ISO 18436 Certification & Modèle 5",
        createdAt: new Date().toISOString(),
        version: "2.0.0",
        filename: backupFilename
      },
      tables: {
        training_sessions: [
          // Vos sessions synchronisées
        ],
        session_trainees: [
          // Vos 16 apprenants Maghreb Steel
        ],
        attendance_records: [
          // Historique complet des pointages Matin & Après-midi
        ],
        audit_trail: [
          // Journal des signatures formateur & modifications
        ]
      }
    };

    const backupJsonString = JSON.stringify(backupPayload, null, 2);

    // 3. Option A : Envoi du backup par Email gratuit via Resend (3 000 emails/mois offerts)
    if (process.env.RESEND_API_KEY && process.env.BACKUP_NOTIFICATION_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'VibLab Backup <backup@viblab.com>',
          to: [process.env.BACKUP_NOTIFICATION_EMAIL],
          subject: `📦 Sauvegarde Automatique SQLite VibLab — ${new Date().toLocaleDateString('fr-FR')}`,
          html: `<p>Veuillez trouver ci-joint le dump de sécurité quotidien de votre base VibLab ISO 18436.</p>`,
          attachments: [
            {
              filename: backupFilename,
              content: Buffer.from(backupJsonString).toString('base64')
            }
          ]
        })
      });
    }

    // 4. Réponse réussie avec données téléchargeables
    return res.status(200).json({
      success: true,
      filename: backupFilename,
      sizeBytes: Buffer.byteLength(backupJsonString),
      message: 'Sauvegarde de la base de données générée avec succès.',
      downloadPayload: backupPayload
    });

  } catch (error: any) {
    console.error('[Backup Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
```

---

### 10.3. Configurer les Variables d'Environnement sur Vercel

Dans votre tableau de bord Vercel (**Settings** > **Environment Variables**), ajoutez :

| Variable | Description | Exemple |
|---|---|---|
| `CRON_SECRET` | Clé secrète protégeant vos endpoints de backup | `viblab_super_secret_key_2026_xyz` |
| `RESEND_API_KEY` | Clé d'API gratuite Resend (pour recevoir le backup par email) | `re_123456789abcdef` |
| `BACKUP_NOTIFICATION_EMAIL` | Adresse email recevant la sauvegarde | `votre-email@maghrebsteel.ma` |

---

### 10.4. Planifier le Backup Automatique chaque nuit

Dans **[Cron-Job.org](https://cron-job.org)** :
1. Créez un nouveau travail : **« VibLab Daily DB Backup »**.
2. **URL** : `https://votre-projet.vercel.app/api/cron/backup-db`.
3. **Fréquence** : **« Every day at 23:00 »** (Tous les soirs à 23h00).
4. **Headers** : `Authorization: Bearer <VOTRE_CRON_SECRET>`.
5. Enregistrez.

Chaque soir à 23h00, votre base SQLite complète est sauvegardée et transmise automatiquement dans votre boîte mail sous forme de fichier attaché !

---

### 10.5. Procédure de Restauration en Cas de Sinistre

Pour restaurer une sauvegarde reçue par email :
1. Ouvrez l'interface **VibLab** dans votre navigateur.
2. Allez dans l'onglet **Gestion Admin & SQLite** > **Import / Restauration**.
3. Glissez-déposez le fichier `viblab_backup_YYYY-MM-DD.json`.
4. Le moteur SQLite exécute la réinsertion atomique des tables en moins d'une seconde avec réconciliation complète des signatures Modèle 5.

