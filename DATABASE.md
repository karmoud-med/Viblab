# Guide & Documentation Complète de la Base de Données SQLite — VibLab

Cette documentation détaille l'emplacement physique, le schéma relationnel, les migrations SQL, le dictionnaire de données et les procédures d'administration de la base de données réelle de **VibLab**.

---

## 1. Emplacement physique du fichier réel

Le fichier physique de la base de données SQLite se trouve directement dans le répertoire du projet :

```
simulateur-de-vibration-industrielle/
├── database/
│   ├── viblab.sqlite                <--- FICHIER RÉEL SQLite (Taille: ~248 Ko)
│   └── migrations/
│       ├── 001_initial_schema.sql   <--- Schéma DDL (tables, contraintes, index)
│       └── 002_seed_real_data.sql   <--- Données réelles Maghreb Steel, modules, émargements
├── scripts/
│   └── build_sqlite_db.js           <--- Script Node.js de build & migration
└── package.json                     <--- Commande "npm run db:build"
```

* **Chemin absolu sous Windows :**  
  `C:\Users\mohas\Downloads\simulateur-de-vibration-industrielle\database\viblab.sqlite`
* **Format :** SQLite 3 (Standard binaire, compatible avec tous les clients SQLite)

---

## 2. Commandes de gestion & Migrations

### Régénérer ou migrer la base physique depuis la console :
```bash
npm run db:build
```
ou directement :
```bash
node scripts/build_sqlite_db.js
```

Ce script applique automatiquement dans l'ordre :
1. `database/migrations/001_initial_schema.sql`
2. `database/migrations/002_seed_real_data.sql`
3. Enregistre les versions appliquées dans la table `schema_migrations`
4. Produit le fichier physique `database/viblab.sqlite`

---

## 3. Architecture et Synchronisation

VibLab propose une double architecture de données :
1. **Mode Fichier Physique (`database/viblab.sqlite`)** : Utilisé pour les sauvegardes officielles, l'intégration backend, les audits qualité, et l'ouverture directe dans des outils comme **DBeaver** ou **DB Browser for SQLite**.
2. **Mode In-Browser (WebAssembly `sql.js` + IndexedDB)** : L'application web charge et synchronise ce moteur dans le navigateur afin de garantir un fonctionnement 100% hors-ligne (offline-first) sécurisé.
3. **Import / Export direct depuis l'application** : Dans le module **Administration des cours**, un bouton permet d'exporter l'état à chaud sous forme de fichier `.sqlite` ou d'importer une sauvegarde externe.

---

## 4. Dictionnaire des données & Tables

### 1. `schema_migrations`
Suivi des scripts de migration appliqués.
| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `version` | TEXT | PRIMARY KEY | Numéro de version (ex: '001', '002') |
| `name` | TEXT | NOT NULL | Nom du fichier de migration |
| `applied_at` | TEXT | DEFAULT now | Date et heure d'exécution ISO |

---

### 2. `users`
Gestion des comptes et des rôles d'accès.
| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Identifiant unique (ex: `usr_admin`, `usr-trainee-ms-1-1`) |
| `username` | TEXT | UNIQUE, NOT NULL | Login de connexion |
| `password_hash`| TEXT | NOT NULL | Mot de passe chiffré ou code d'accès |
| `full_name` | TEXT | NOT NULL | Nom et prénom complet |
| `email` | TEXT | UNIQUE | Adresse e-mail professionnelle |
| `role` | TEXT | CHECK IN ('admin', 'formateur', 'eleve') | Rôle système avec droits stricts |
| `is_active` | INTEGER| DEFAULT 1 | 1 = Actif, 0 = Suspendu |
| `created_at` | TEXT | DEFAULT now | Date de création du compte |
| `last_login_at`| TEXT | NULL | Dernière date de connexion |

---

### 3. `courses` & `modules`
Catalogue certifiant ISO 18436-2 (Analyse vibratoire Niveau 1 - 35h).
| Table | Colonnes clés | Description |
|---|---|---|
| `courses` | `id`, `title`, `level`, `total_duration_hours`, `is_published` | Métadonnées de la formation |
| `modules` | `id`, `course_id`, `title`, `order_index`, `duration_min`, `access_code` | Les 7 modules VCAT-I avec leurs codes d'accès |

---

### 4. `training_sessions`
Sessions de formation en entreprise (Maghreb Steel, OCP, GIAC, OFPPT).
| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | Identifiant unique (ex: `sess-ms-vcat1-grp1`) |
| `session_code` | TEXT (UNIQUE) | Code officiel (ex: `SESS-2026-MS-GRP1`) |
| `title` | TEXT | Intitulé officiel de l'action |
| `company_name` | TEXT | Entreprise cliente (ex: `MAGHREB STEEL`) |
| `trainer_name` | TEXT | Formateur en charge (`M. Mohammed KARMOUD`) |
| `site_location`| TEXT | Lieu de déroulement (`Site Tit Mellil`) |
| `start_date` / `end_date` | TEXT | Dates de début et fin |
| `total_days` | INTEGER | Nombre total de jours (5 jours) |
| `status` | TEXT | `'completed'`, `'in_progress'`, `'planned'` |
| `is_multi_part`| INTEGER | 1 si la session est découpée en plusieurs parties |
| `parts_json` | TEXT | Structure JSON des parties et des jours |

---

### 5. `session_trainees`
Répertoire officiel des apprenants inscrits à chaque session.
| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | Identifiant d'inscription stagiaire |
| `session_id` | TEXT (FK) | Référence vers `training_sessions` |
| `user_id` | TEXT (FK) | Compte utilisateur associé |
| `full_name` | TEXT | Nom et prénom de l'apprenant |
| `matricule` | TEXT | Matricule interne Maghreb Steel (ex: `MS-101`) |
| `cin` | TEXT | N° CIN officiel (ex: `BJ218263`) |
| `cnss` | TEXT | N° CNSS pour déclaration OFPPT (ex: `164591061`) |
| `csp` | TEXT | Catégorie Socio-Professionnelle : `C` (Cadre), `E` (Employé), `O` (Ouvrier) |
| `job_title` | TEXT | Fonction exercée au sein de l'usine |
| `site_entity` | TEXT | Entité d'affectation (Laminoir à chaud, Aciérie, etc.) |
| `access_code` | TEXT | Code d'accès individuel à la plateforme |
| `notes` | TEXT | Mention d'émargement officielle |

---

### 6. `session_attendance`
Feuilles de présence et émargements officiels **Modèle 5**.
| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | Identifiant unique du pointage |
| `session_id` | TEXT (FK) | Session concernée |
| `trainee_id` | TEXT (FK) | Stagiaire pointé |
| `day_index` | INTEGER | Jour de formation (de 1 à 5) |
| `date` | TEXT | Date du jour (ex: `2026-09-14`) |
| `slot` | TEXT | Créneau : `'matin'` (08h30-12h30) ou `'apres_midi'` (13h30-16h30) |
| `status` | TEXT | `'present'`, `'retard'`, `'absent_justifie'`, `'absent_injustifie'` |
| `arrival_time` | TEXT | Heure d'émargement constatée |
| `comment` | TEXT | Motif d'absence justifiée ou observation |
| `marked_by` | TEXT | Opérateur ayant validé le pointage |
| `marked_at` | TEXT | Horodatage certifié |

---

### 7. `audit_logs`
Piste d'audit et registre de conformité réglementaire.
| Colonne | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | Identifiant d'événement |
| `user_id` | TEXT | Auteur de l'action |
| `action` | TEXT | Nom de l'action (`CREATE_USER`, `SIGN_ATTENDANCE_P1`, etc.) |
| `target_type` | TEXT | Type d'entité ciblée (`session_attendance`, `users`, etc.) |
| `target_id` | TEXT | Identifiant de l'entité |
| `details` | TEXT | Description détaillée de l'opération |
| `timestamp` | TEXT | Horodatage ISO à la milliseconde |

---

## 5. Comment ouvrir et interroger la base réelle

### Option 1 : Via l'outil graphique DB Browser for SQLite (Recommandé)
1. Téléchargez et ouvrez **[DB Browser for SQLite](https://sqlitebrowser.org/)**.
2. Cliquez sur **« Ouvrir une base de données »**.
3. Sélectionnez le fichier :  
   `c:\Users\mohas\Downloads\simulateur-de-vibration-industrielle\database\viblab.sqlite`
4. Vous pouvez parcourir visuellement toutes les tables, exécuter des requêtes SQL et exporter en CSV/Excel.

### Option 2 : Via DBeaver ou DataGrip
1. Créer une nouvelle connexion **SQLite**.
2. Indiquer le chemin du fichier `database/viblab.sqlite`.
3. Tester la connexion.

### Option 3 : En ligne de commande avec Python
```bash
python -c "import sqlite3; conn = sqlite3.connect('database/viblab.sqlite'); print(conn.execute('SELECT matricule, full_name, cin FROM session_trainees LIMIT 5').fetchall())"
```

### Option 4 : En Node.js
```javascript
import fs from 'fs';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const fileBuffer = fs.readFileSync('database/viblab.sqlite');
const db = new SQL.Database(fileBuffer);

const res = db.exec("SELECT count(*) FROM session_trainees;");
console.log('Apprenants :', res[0].values[0][0]);
```

---

## 6. Requêtes SQL types utiles

### Lister les 16 stagiaires Maghreb Steel avec leur taux d'émargement :
```sql
SELECT 
    st.matricule,
    st.full_name,
    st.cin,
    st.job_title,
    COUNT(CASE WHEN sa.status = 'present' THEN 1 END) AS creneaux_presents,
    COUNT(sa.id) AS total_creneaux,
    ROUND(COUNT(CASE WHEN sa.status = 'present' THEN 1 END) * 100.0 / COUNT(sa.id), 1) || '%' AS taux_presence,
    st.notes
FROM session_trainees st
LEFT JOIN session_attendance sa ON sa.trainee_id = st.id
GROUP BY st.id
ORDER BY st.matricule;
```

### Consulter la feuille Modèle 5 d'un jour spécifique (ex: Jour 1) :
```sql
SELECT 
    st.matricule,
    st.full_name,
    MAX(CASE WHEN sa.slot = 'matin' THEN sa.status END) AS presence_matin,
    MAX(CASE WHEN sa.slot = 'apres_midi' THEN sa.status END) AS presence_apres_midi
FROM session_trainees st
JOIN session_attendance sa ON sa.trainee_id = st.id
WHERE sa.day_index = 1
GROUP BY st.id
ORDER BY st.matricule;
```

### Vérifier le journal d'audit de sécurité :
```sql
SELECT timestamp, action, user_id, details 
FROM audit_logs 
ORDER BY timestamp DESC;
```
