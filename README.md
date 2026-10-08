# VibLab — Vibration Intelligence Center & Simulateur Industriel 3D

> **Plateforme industrielle de simulation vibratoire, formation certifiante ISO 18436-2 et gestion réglementaire des sessions de formation continue (Maghreb Steel & OCP Maintenance Solutions).**

---

## Sommaire

1. [Vue d'ensemble du Projet](#1-vue-densemble-du-projet)
2. [Piliers Fonctionnels & Modules](#2-piliers-fonctionnels--modules)
   - [Simulateur Industriel 3D (Groupe Motopompe)](#21-simulateur-industriel-3d-groupe-motopompe)
   - [Calculateur & Analyseur de Roulements](#22-calculateur--analyseur-de-roulements)
   - [Parcours de Cours Certifiant VCAT-I (7 Modules)](#23-parcours-de-cours-certifiant-vcat-i-7-modules)
   - [Banque de Questions & Examen QCM (Seuil 85%)](#24-banque-de-questions--examen-qcm-seuil-85)
   - [Gestion des Sessions & Émargements Officiels Modèle 5](#25-gestion-des-sessions--émargements-officiels-modèle-5)
   - [Administration Complète & Édition de Sessions](#26-administration-complète--édition-de-sessions)
   - [Sécurité & Blindage Anti-Capture d'Écran](#27-sécurité--blindage-anti-capture-décran)
3. [Architecture Technique & Stack](#3-architecture-technique--stack)
4. [Base de Données SQLite & Système de Migrations](#4-base-de-données-sqlite--système-de-migrations)
5. [Rôles & Matrice des Permissions](#5-rôles--matrice-des-permissions)
6. [Installation & Lancement Local](#6-installation--lancement-local)
7. [Scripts Disponibles](#7-scripts-disponibles)
8. [Guide d'Exploitation & Cas d'Usage](#8-guide-dexploitation--cas-dusage)

---

## 1. Vue d'ensemble du Projet

**VibLab** est un environnement d'apprentissage et de diagnostic technique de pointe destiné aux ingénieurs, techniciens mécaniques et inspecteurs de maintenance conditionnelle. Développé en partenariat pour les cohortes industrielles (notamment **Maghreb Steel** et **OCP Maintenance Solutions**), il combine :

* Un **banc d'essai virtuel 3D temps réel** reproduisant fidèlement les vibrations, déformations et signatures spectrales FFT des machines tournantes.
* Un **système de formation en ligne conforme à la norme ISO 18436-2** (Catégorie I à IV).
* Un **module de gestion administrative et réglementaire** conforme aux exigences de l'**OFPPT** et des **GIAC** (émargements officiels **Modèle 5**, sessions découpées en plusieurs parties, exports CSV pour audits qualité).

---

## 2. Piliers Fonctionnels & Modules

### 2.1 Simulateur Industriel 3D (Groupe Motopompe)
* **Modélisation mécanique complète** : Moteur asynchrone triphasé, accouplement élastique à mâchoires, palier de pompe (lanterne), volute centrifuge, brides d'aspiration/refoulement, tuyauteries et châssis mécano-soudé sur massif béton.
* **Cinématique & Rendu WebGL (Three.js)** : Vitesse de rotation paramétrable (0 à 3600 tr/min), textures métalliques réalistes, vue éclatée et gestion de transparence du carter.
* **Défauts physiques simulés avec impact FFT en temps réel** :
  - **Balourd (1X)** : Balourd statique et dynamique avec modulation d'amplitude.
  - **Désalignement (1X, 2X, 3X)** : Désalignement angulaire et parallèle avec déphasage directionnel.
  - **Défauts d'engrenage & fréquences d'engrènement (GMF)**.
  - **Dégradation de roulements (chocs périodiques haute fréquence)**.
* **Normes de sévérité ISO 10816-3 / 20816-3** : Calcul automatique de la vitesse vibratoire globale RMS (mm/s), seuils d'alerte et zones d'admissibilité A, B, C, D selon la puissance et le type de fondation.

---

### 2.2 Calculateur & Analyseur de Roulements
* Moteur cinématique pour roulements à billes et à rouleaux (ex: **6309** et **NU 309**).
* Calcul instantané des 4 fréquences caractéristiques de défaut :
  - **BPFO** (*Ball Pass Frequency Outer*) : Fréquence de bague extérieure.
  - **BPFI** (*Ball Pass Frequency Inner*) : Fréquence de bague intérieure.
  - **BSF** (*Ball Spin Frequency*) : Fréquence de rotation des éléments roulants.
  - **FTF** (*Fundamental Train Frequency*) : Fréquence de la cage.
* Curseurs harmoniques interactifs superposés sur le spectre FFT et affichage 3D animé de la propagation des ondes de choc.

---

### 2.3 Parcours de Cours Certifiant VCAT-I (7 Modules)
Le catalogue de cours structuré selon la norme **ISO 18436-2** comprend 7 modules thématiques officiels (35 heures au total) :
1. **Module 1** : Stratégie de maintenance prévisionnelle, surveillance vibratoire & courbe P-F.
2. **Module 2** : Notions vibratoires fondamentales (période, fréquence, Déplacement, Vitesse, Accélération).
3. **Module 3** : Chaîne de mesure, capteurs piézo-électriques, montage (goujon, aimant) et bande passante.
4. **Module 4** : Indicateurs globaux, RMS, facteur de crête et normes ISO 10816-3 / 20816-3.
5. **Module 5** : Diagnostic des défauts mécaniques majeurs (balourd, désalignement, jeux, roulements).
6. **Module 6** : Études de cas réels industriels, cascades spectrales et rédaction de rapports de préconisation.
7. **Module 7** : Ateliers pratiques interactifs sur banc d'essai virtuel 3D et restitution.

---

### 2.4 Banque de Questions & Examen QCM (Seuil 85%)
* Plus de 150 questions professionnelles classées par niveau de difficulté, pièges de terrain et gravité.
* Types d'épreuves : Choix unique, choix multiple, saisie numérique avec tolérance physique.
* Outils intégrés dans le QCM : tableur ISO, convertisseur cinématique, calculateur de fréquence.
* Seuil officiel d'admission fixé à **85%** pour délivrance de l'attestation de réussite.

---

### 2.5 Gestion des Sessions & Émargements Officiels Modèle 5
* **Cohortes d'entreprises** : Exemple de la session pilote **Maghreb Steel (Tit Mellil)** avec 16 apprenants inscrits (`MS-101` à `MS-116`).
* **Découpage multi-parties flexible** : Capacité de scinder une session en plusieurs blocs séparés par une pause inter-session (ex : Partie 1 de 3 jours en septembre + pause de 14 jours + Partie 2 de 2 jours en octobre).
* **Pointage matin & après-midi** : Créneaux 08h30-12h30 et 13h30-16h30 avec suivi des retards horodatés et justificatifs d'absence d'usine.
* **Génération de la feuille officielle Modèle 5** :
  - Mise en page réglementaire pour déclaration OFPPT / GIAC.
  - Calcul automatique des taux d'assiduité par stagiaire.
  - Impression et export PDF prêt à signer.
* **Export CSV certifié** : Téléchargement instantané des données de présence sous format tableur UTF-8 BOM avec séparateur `;` pour Excel.

---

### 2.6 Administration Complète & Édition de Sessions
Les administrateurs disposent des pleins pouvoirs de gestion :
* **Création de sessions** : Attribution du code de session, dates, lieu, formateur et découpage en jours.
* **Modification / Mise à jour des sessions existantes** :
  - Modification du titre et du code de session.
  - Ajustement des dates de début et de fin.
  - Modification du nombre total de jours et réorganisation du nombre de jours de la Partie 1 et de la Partie 2.
  - Changement du formateur référent, du lieu et du statut officiel (`planned`, `in_progress`, `completed`, `archived`).
* **Gestion des comptes & apprenants** : Ajout, modification, réassignation de cohorte, génération de fiches d'identifiants et réinitialisation de mots de passe.
* **Console SQL intégrée** : Exécution directe de requêtes SQL sur la base de données SQLite avec visualisation tabulaire.
* **Sauvegarde & Restauration** : Export et réimport direct du fichier binaire `.sqlite`.

---

### 2.7 Sécurité & Blindage Anti-Capture d'Écran
* Scripts dédiés pour protéger le contenu pédagogique confidentiel contre les enregistrements d'écran non autorisés :
  - `ACTIVER-BLINDAGE-ANTI-OBS.bat` : Active le blindage mémoire contre les logiciels de capture vidéo (OBS Studio, Xbox Game Bar, Discord, Zoom).
  - `LANCER-VIBLAB-SECURISE.bat` : Démarre le navigateur en mode kiosk sécurisé sous surveillance.
  - `scripts/protect_screen.py` : Utilise l'API Windows `SetWindowDisplayAffinity` (`WDA_MONITOR`) pour masquer le contenu des captures d'écran.

---

## 3. Architecture Technique & Stack

| Composant | Technologie | Rôle |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Interface réactive, typage statique strict |
| **Bundler & Serveur Dev** | Vite 6 | Compilation ultra-rapide, Hot Module Replacement (HMR) |
| **Styles & Design System** | TailwindCSS 4 + CSS Vanilla | Palette professionnelle, typographie Outfit/Inter |
| **Animation & Micro-interactions** | Motion (Framer Motion) | Transitions fluides et micro-animations |
| **Simulation 3D & WebGL** | Three.js | Rendu 3D du motopompe, cinématique, éclairages |
| **Moteur de Données** | SQLite 3 via WebAssembly (`sql.js`) | Base relationnelle autonome, transactions fiables |
| **Persistance Navigateur** | IndexedDB (`viblab_sqlite_db`) | Stockage local binaire persistant |
| **Icons & Composants UI** | Lucide React | Iconographie technique moderne |
| **Protection Système** | Python (ctypes Win32 API) | Blindage anti-capture d'écran sous Windows |

---

## 4. Base de Données SQLite & Système de Migrations

La base de données repose sur un fichier physique SQLite standard et versionné :

### 4.1 Fichiers du projet
```
database/
├── viblab.sqlite                <--- FICHIER PHYSIQUE SQLite RÉEL (~248 Ko)
└── migrations/
    ├── 001_initial_schema.sql   <--- Schéma DDL (tables, contraintes, index)
    └── 002_seed_real_data.sql   <--- Données initiales réelles (Maghreb Steel)
```

### 4.2 Schéma relationnel
* **`schema_migrations`** : Suivi des versions de migration exécutées.
* **`users`** : Comptes d'authentification (administrateurs, formateurs, stagiaires).
* **`courses` & `modules`** : Catalogue ISO 18436-2 et les 7 modules de formation.
* **`user_progress`** : Suivi de l'avancement par module et slide.
* **`user_quiz_results`** : Résultats et scores obtenus aux QCM.
* **`user_course_status`** : Statut d'admission et certification.
* **`training_sessions`** : Sessions d'entreprises, planning et découpage temporel.
* **`session_trainees`** : Stagiaires inscrits avec matricules, CIN, CNSS et postes.
* **`session_attendance`** : 160 pointages officiels Modèle 5 (matin et après-midi).
* **`audit_logs`** : Registre immuable de traçabilité horodaté.

### 4.3 Commande de régénération / migration
Pour reconstruire ou appliquer les migrations sur le fichier physique :
```bash
npm run db:build
```
*(Pour plus de détails techniques, consultez [DATABASE.md](DATABASE.md)).*

---

## 5. Rôles & Matrice des Permissions

| Fonctionnalité | Administrateur (`admin`) | Formateur (`formateur`) | Apprenant (`eleve`) |
|---|:---:|:---:|:---:|
| **Consultation des cours 3D & Modules** | ✅ | ✅ | ✅ |
| **Passage des quiz & simulateur** | ✅ | ✅ | ✅ |
| **Pointage présences (Matin / Après-midi)** | ✅ | ✅ | ❌ |
| **Impression Feuille Modèle 5** | ✅ | ✅ | ❌ |
| **Export CSV des émargements** | ✅ | ✅ | ❌ |
| **Création d'une nouvelle session** | ✅ | ❌ | ❌ |
| **Modification d'une session existante (dates, jours)** | ✅ | ❌ | ❌ |
| **Gestion des comptes & mots de passe** | ✅ | ❌ | ❌ |
| **Console SQL & Export base SQLite** | ✅ | ❌ | ❌ |
| **Consultation du journal d'audit complet** | ✅ | ❌ | ❌ |

---

## 6. Installation & Lancement Local

### Prérequis
* **Node.js** (version 18 ou supérieure recommandée)
* **npm** (inclus avec Node.js)
* **Python 3.10+** (optionnel, pour les scripts de blindage anti-capture)

### Étapes d'installation

1. **Cloner ou ouvrir le dossier du projet** :
   ```bash
   cd simulateur-de-vibration-industrielle
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Construire la base de données SQLite réelle** :
   ```bash
   npm run db:build
   ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application s'ouvre sur : **`http://localhost:3001/`**

---

## 7. Scripts Disponibles

Dans le fichier `package.json`, plusieurs commandes sont préconfigurées :

| Commande | Action |
|---|---|
| `npm run dev` | Démarre le serveur local Vite sur le port 3001 |
| `npm run build` | Compile le projet en bundle de production optimisé dans `/dist` |
| `npm run preview` | Prévisualise localement le bundle de production généré |
| `npm run lint` | Lance la vérification stricte des types TypeScript (`tsc --noEmit`) |
| `npm run db:build` | Exécute les migrations et génère le fichier réel `database/viblab.sqlite` |

---

## 8. Guide d'Exploitation & Cas d'Usage

### 8.1 Modifier une session existante (Espace Admin)
1. Connectez-vous avec le compte **Admin** (`amine.salamat@maghrebsteel.ma` / `admin`).
2. Rendez-vous dans le module **Sessions & émargement**.
3. Dans la barre supérieure ou dans l'onglet **Sessions & Planning**, cliquez sur le bouton **« Modifier la session »** (icône crayon).
4. Ajustez à votre convenance :
   - L'intitulé ou le code de la session.
   - Les dates de début et de fin.
   - Le découpage en parties (ex: passer de 3+2 jours à 4+1 jours, ou modifier le nombre total de jours).
   - Le formateur référent, le lieu ou le statut (`in_progress`, `completed`, etc.).
5. Cliquez sur **« Enregistrer les modifications »** : les modifications sont immédiatement persistées dans la base SQLite et prises en compte par la feuille Modèle 5.

### 8.2 Pointer les présences & imprimer le Modèle 5
1. Sélectionnez la session active (ex: *Groupe 1 Maghreb Steel*).
2. Choisissez le **Jour** (Jour 1 à 5) et le créneau (**Matin** ou **Après-midi**).
3. Cliquez sur le statut d'un stagiaire pour basculer son état (*Présent*, *Retard* avec heure, *Absent justifié* avec motif).
4. Cliquez sur **« Imprimer Modèle 5 »** pour générer la feuille officielle prête pour audit qualité.
5. Cliquez sur **« Exporter CSV »** pour extraire l'ensemble du registre vers Excel.

### 8.3 Ouvrir la base avec un logiciel externe
Vous pouvez à tout moment inspecter la base réelle [database/viblab.sqlite](file:///c:/Users/mohas/Downloads/simulateur-de-vibration-industrielle/database/viblab.sqlite) avec **DB Browser for SQLite** ou **DBeaver** pour auditer les données en direct.

---

## 9. Déploiement sur PythonAnywhere

**Oui, le déploiement sur PythonAnywhere est 100% possible et très simple !**

Comme VibLab compile en une Single Page Application (SPA) optimisée dans le dossier `dist/` (avec ses fichiers statiques JS, CSS et WASM), un fichier serveur WSGI Flask clé en main [app.py](app.py) est inclus dans le projet.

### Procédure de déploiement pas à pas :

1. **Compiler le bundle en local :**
   ```bash
   npm run build
   ```
   *(Cela génère le dossier de production optimisé `/dist`).*

2. **Transférer les fichiers sur PythonAnywhere :**
   Sur votre compte PythonAnywhere (onglet **Files** ou via Git) :
   - Déposez le dossier `dist/`
   - Déposez le fichier `app.py`
   - Déposez le fichier `requirements.txt`

3. **Installer Flask sur PythonAnywhere :**
   Ouvrez une **Bash Console** sur PythonAnywhere et tapez :
   ```bash
   pip install --user -r requirements.txt
   ```

4. **Configurer l'application Web (onglet Web) :**
   - Cliquez sur **Add a new web app** > Choisissez **Manual configuration** > Sélectionnez **Python 3.10** ou **3.11**.
   - Dans la section **Code** :
     - **Source code :** `/home/<votre_username>/simulateur-de-vibration-industrielle`
     - **Working directory :** `/home/<votre_username>/simulateur-de-vibration-industrielle`
   - Cliquez sur le lien **WSGI configuration file** (`/var/www/<votre_username>_pythonanywhere_com_wsgi.py`) et remplacez son contenu par :
     ```python
     import sys
     import os

     project_home = '/home/<votre_username>/simulateur-de-vibration-industrielle'
     if project_home not in sys.path:
         sys.path.insert(0, project_home)

     from app import app as application
     ```
   - Dans la section **Static files** (pour des performances maximales) :
     - **URL :** `/assets/`
     - **Directory :** `/home/<votre_username>/simulateur-de-vibration-industrielle/dist/assets`

5. **Lancer le site :**
   Cliquez sur le bouton vert **« Reload <votre_username>.pythonanywhere.com »**.
   Votre application est en ligne en HTTPS sur `https://<votre_username>.pythonanywhere.com/` !

---

## 10. Déploiement sur Vercel (Recommandé & Ultra-Rapide)

Vercel est la plateforme la plus performante et la plus simple pour héberger VibLab gratuitement :
* **Routage SPA garanti sans erreur 404** grâce au fichier [vercel.json](vercel.json).
* **MIME Types WebAssembly configurés** (`application/wasm`) pour le moteur SQLite.
* **CDN mondial ultra-rapide** pour Three.js, les textures et les modèles 3D.
* **HTTPS et certificat SSL automatique**.

👉 **Consultez le guide complet pas à pas : [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**
*(Méthode GitHub en 1 clic ou via Vercel CLI).*


