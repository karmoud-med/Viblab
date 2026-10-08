-- ============================================================================
-- VIBLAB PRO - MIGRATION 002: REAL SEED DATA
-- Date: 2026-10-07
-- Description: Données réelles Maghreb Steel, Utilisateurs, 7 Modules VCAT-I,
--              Émargements officiels Modèle 5 et Piste d'audit.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. UTILISATEURS DU SYSTÈME (ADMINISTRATEUR & FORMATEUR)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at, last_login_at)
VALUES
('usr_admin', 'admin', 'AdminVibLab2026!', 'M. Amine SALAMAT (Gestionnaire Formation)', 'amine.salamat@maghrebsteel.ma', 'admin', 1, '2026-09-01T08:00:00.000Z', '2026-10-07T14:30:00.000Z'),
('usr_trainer', 'mkarmoud', 'KarmoudVibe2026!', 'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)', 'mohammed.karmoud@viblab.com', 'formateur', 1, '2026-09-01T08:00:00.000Z', '2026-10-07T15:00:00.000Z');

-- ----------------------------------------------------------------------------
-- 2. COURS CERTIFIANT NIVEAU 1 (ISO 18436-2)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO courses (id, title, subtitle, description, level, category, total_duration_hours, is_published, created_at, updated_at)
VALUES
('vibration_1', 'Vibrations Niveau 1 — Formation Certifiante', 'Formation Certifiante selon ISO 18436-2 — OCP Maintenance Solutions & Maghreb Steel', 'Support officiel de formation Niveau 1 en surveillance vibratoire des machines tournantes, analyse spectrale et maintenance conditionnelle.', 'Niveau 1', 'Analyse Vibratoire', 35.0, 1, '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z');

-- ----------------------------------------------------------------------------
-- 3. LES 7 MODULES OFFICIELS VCAT-I
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO modules (id, course_id, title, subtitle, html_path, html_content, order_index, duration_min, access_code, trainer_notes, created_at, updated_at, updated_by)
VALUES
('v1_mod_1', 'vibration_1', 'Module 1 - Stratégie de maintenance', 'Maintenance conditionnelle, surveillance vibratoire & retour sur investissement', '/courses/niveau1/module_1_strategie_maintenance.html', NULL, 1, 45, 'OCPms2026@', 'Présenter la courbe P-F et le ROI de la maintenance prédictive.', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin'),
('v1_mod_2', 'vibration_1', 'Module 2 - Notions vibratoires', 'Fréquence, amplitude, période, grandeurs Déplacement, Vitesse, Accélération', '/courses/niveau1/module_2_notions_vibratoires.html', NULL, 2, 50, 'OCPms2026@', 'Manipuler les conversions d''unités et la relation v = 2*pi*f*d.', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin'),
('v1_mod_3', 'vibration_1', 'Module 3 - Chaîne de mesure', 'Accéléromètres piézo, montage (aimant, embase, goujon), réponse en fréquence', '/courses/niveau1/module_3_chaine_mesure.html', NULL, 3, 55, 'OCPms2026@', 'Insister sur l''impact du mode de fixation sur la bande passante utile.', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin'),
('v1_mod_4', 'vibration_1', 'Module 4 - Indicateurs et normes', 'Norme ISO 10816-3 / 20816-3, vitesse globale RMS, facteur de crête & seuils', '/courses/niveau1/module_4_indicateurs_normes.html', NULL, 4, 60, 'OCPms2026@', 'Classer des machines selon le groupe ISO (puissance, support rigide/souple).', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin'),
('v1_mod_5', 'vibration_1', 'Module 5 - Diagnostic des défauts', 'Balourd statique/couple, désalignement, jeux, roulements (BPFO/BPFI)', '/courses/niveau1/module_5_diagnostic_defauts.html', NULL, 5, 65, 'OCPms2026@', 'Détailler les signatures spectrales 1X, 2X, 3X et les fréquences de défaut.', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin'),
('v1_mod_6', 'vibration_1', 'Module 6 - Pratique Diagnostic sur scénarios', 'Études de cas réels industriels, cascades spectrales, diagnostics et préconisations', '/courses/niveau1/module_5_pratique_scenarios.html', NULL, 6, 70, 'OCPms2026@', 'Mettre les apprenants en situation d''audit avec rapport de préconisation.', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin'),
('v1_mod_7', 'vibration_1', 'Module 7 - Pratique & Ateliers VibLab', 'Travaux pratiques interactifs, banc d''essai 3D et validation des compétences', '/courses/niveau1/module_pratique_niveau_1.html', NULL, 7, 75, 'OCPms2026@', 'Manipulations directes sur le simulateur 3D et restitution.', '2026-01-15T08:00:00.000Z', '2026-10-07T15:00:00.000Z', 'admin');

-- ----------------------------------------------------------------------------
-- 4. SESSIONS RÉELLES MAGHREB STEEL
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO training_sessions (id, session_code, title, course_id, company_name, action_theme, trainer_name, site_location, start_date, end_date, total_days, status, is_multi_part, parts_json, description, created_at)
VALUES
(
  'sess-ms-vcat1-grp1',
  'SESS-2026-MS-GRP1',
  'Formation Analyse Vibratoire Niveau 1 — Groupe 1 (Terminée)',
  'vibration_1',
  'MAGHREB STEEL',
  'Analyse des vibrations niveau 1',
  'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
  'MAGHREB STEEL — Site Tit Mellil & Salle Formation',
  '2026-09-14',
  '2026-10-02',
  5,
  'completed',
  1,
  '[{"partNumber":1,"title":"Partie 1 (3 Jours — Septembre)","startDate":"2026-09-14","endDate":"2026-09-16","daysCount":3,"days":[{"dayIndex":1,"date":"2026-09-14","displayDate":"14/09/2026","label":"Jour 1 (14/09)"},{"dayIndex":2,"date":"2026-09-15","displayDate":"15/09/2026","label":"Jour 2 (15/09)"},{"dayIndex":3,"date":"2026-09-16","displayDate":"16/09/2026","label":"Jour 3 (16/09)"}]},{"partNumber":2,"title":"Partie 2 (2 Jours — Octobre)","startDate":"2026-10-01","endDate":"2026-10-02","daysCount":2,"days":[{"dayIndex":4,"date":"2026-10-01","displayDate":"01/10/2026","label":"Jour 4 (01/10)"},{"dayIndex":5,"date":"2026-10-02","displayDate":"02/10/2026","label":"Jour 5 (02/10)"}]}]',
  'Session réelle terminée pour Maghreb Steel. Découpage en 2 parties : 14, 15, 16 septembre (Partie 1) puis reprise les 01 et 02 octobre (Partie 2). Feuilles d’émargement officielles Modèle 5 signées.',
  '2026-09-01T08:00:00.000Z'
),
(
  'sess-ms-vcat1-grp2',
  'SESS-2026-MS-GRP2',
  'Formation Analyse Vibratoire Niveau 1 — Groupe 2',
  'vibration_1',
  'MAGHREB STEEL',
  'Analyse des vibrations niveau 1',
  'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
  'MAGHREB STEEL — Usine Tit Mellil',
  '2026-10-12',
  '2026-10-27',
  5,
  'in_progress',
  1,
  '[]',
  'Planning Maghreb Steel : Partie 1 (12 au 14 oct) et Partie 2 (26 au 27 oct).',
  '2026-09-20T08:00:00.000Z'
),
(
  'sess-ms-vcat1-grp3',
  'SESS-2026-MS-GRP3',
  'Formation Analyse Vibratoire Niveau 1 — Groupe 3',
  'vibration_1',
  'MAGHREB STEEL',
  'Analyse des vibrations niveau 1',
  'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
  'MAGHREB STEEL — Usine Tit Mellil',
  '2026-10-15',
  '2026-10-30',
  5,
  'planned',
  1,
  '[]',
  'Session planifiée selon le calendrier officiel Maghreb Steel.',
  '2026-09-20T08:00:00.000Z'
),
(
  'sess-ms-therm-grp1',
  'SESS-2026-MS-THERM-G1',
  'Formation Thermographie Infrarouge — Groupe 1',
  'vibration_1',
  'MAGHREB STEEL',
  'Thermographie',
  'M. Karim ELBAZ (OCP Maintenance Solutions)',
  'MAGHREB STEEL — Salle Technique',
  '2026-10-19',
  '2026-10-23',
  5,
  'planned',
  0,
  '[]',
  'Session continue Thermographie 19 au 23 Octobre 2026.',
  '2026-09-20T08:00:00.000Z'
);

-- ----------------------------------------------------------------------------
-- 5. LES 16 APPRENANTS MAGHREB STEEL (COMPTES UTILISATEURS & RÉPERTOIRE)
-- ----------------------------------------------------------------------------
-- Insertion dans 'users'
INSERT OR REPLACE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at)
VALUES
('usr-trainee-ms-1-1', 'mouhcine.bouras', 'MS-8263', 'BOURAS MOUHCINE', 'mouhcine.bouras@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-2', 'othmane.tahiri', 'MS-9173', 'TAHIRI OTHMANE', 'othmane.tahiri@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-3', 'abdelghani.elghazouani', 'MS-9621', 'EL GHAZOUANI ABDELGHANI', 'abdelghani.elghazouani@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-4', 'anass.ezzaki', 'MS-6997', 'EZZAKI ANASS', 'anass.ezzaki@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-5', 'adnane.aitmoussa', 'MS-2252', 'AIT MOUSSA ADNANE', 'adnane.aitmoussa@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-6', 'adnan.alilou', 'MS-3715', 'ALILOU ADNAN', 'adnan.alilou@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-7', 'issam.elboukili', 'MS-2715', 'EL BOUKILI ISSAM', 'issam.elboukili@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-8', 'taha.alaoui', 'MS-4148', 'ALAOUI SOSSEY TAHA', 'taha.alaoui@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-9', 'abderrazzak.amassoul', 'MS-0294', 'AMASSOUL ABDERRAZZAK', 'abderrazzak.amassoul@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-10', 'salah.chabih', 'MS-4267', 'CHABIH SALAH', 'salah.chabih@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-11', 'tarik.makhfi', 'MS-5777', 'MAKHFI TARIK', 'tarik.makhfi@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-12', 'youssef.elkouche', 'MS-9244', 'EL KOUCHE YOUSSEF', 'youssef.elkouche@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-13', 'abderrahim.elbouzi', 'MS-7389', 'EL BOUZI ABDERRAHIM', 'abderrahim.elbouzi@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-14', 'youssef.khatimi', 'MS-7711', 'KHATIMI YOUSSEF', 'youssef.khatimi@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-15', 'mohamed.elmakkaouy', 'MS-9778', 'EL MAKKAOUY MOHAMED', 'mohamed.elmakkaouy@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z'),
('usr-trainee-ms-1-16', 'elmehdi.abdou', 'MS-8257', 'ABDOU ELMEHDI', 'elmehdi.abdou@maghrebsteel.ma', 'eleve', 1, '2026-09-10T08:00:00.000Z');

-- Insertion dans 'session_trainees'
INSERT OR REPLACE INTO session_trainees (id, session_id, user_id, full_name, matricule, cin, cnss, csp, job_title, site_entity, email, phone, access_code, course_access_granted, notes, created_at)
VALUES
('trainee-ms-g1-1', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-1', 'BOURAS MOUHCINE', 'MS-101', 'BJ218263', '164591061', 'E', 'Technicien de maintenance mécanique', 'MAGHREB STEEL — Laminoir à chaud', 'mouhcine.bouras@maghrebsteel.ma', '0661234567', 'MS-8263', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-2', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-2', 'TAHIRI OTHMANE', 'MS-102', 'BH389173', '189201944', 'E', 'Technicien de maintenance prédictive', 'MAGHREB STEEL — Laminoir à froid', 'othmane.tahiri@maghrebsteel.ma', '0661234568', 'MS-9173', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-3', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-3', 'EL GHAZOUANI ABDELGHANI', 'MS-103', 'BK249621', '173829102', 'C', 'Ingénieur fiabilité mécanique', 'MAGHREB STEEL — Aciérie électrique', 'abdelghani.elghazouani@maghrebsteel.ma', '0661234569', 'MS-9621', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-4', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-4', 'EZZAKI ANASS', 'MS-104', 'BL126997', '194820153', 'E', 'Inspecteur vibratoire & graissage', 'MAGHREB STEEL — Ligne de décapage', 'anass.ezzaki@maghrebsteel.ma', '0661234570', 'MS-6997', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-5', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-5', 'AIT MOUSSA ADNANE', 'MS-105', 'T292252', '152940294', 'E', 'Électromécanicien industriel', 'MAGHREB STEEL — Centrale utilités', 'adnane.aitmoussa@maghrebsteel.ma', '0661234571', 'MS-2252', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-6', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-6', 'ALILOU ADNAN', 'MS-106', 'D893715', '168392015', 'E', 'Technicien de ronde vibratoire', 'MAGHREB STEEL — Laminoir à chaud', 'adnan.alilou@maghrebsteel.ma', '0661234572', 'MS-3715', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-7', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-7', 'EL BOUKILI ISSAM', 'MS-107', 'CD592715', '174920482', 'C', 'Superviseur maintenance mécanique', 'MAGHREB STEEL — Aciérie', 'issam.elboukili@maghrebsteel.ma', '0661234573', 'MS-2715', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-8', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-8', 'ALAOUI SOSSEY TAHA', 'MS-108', 'AA44148', '183920491', 'E', 'Technicien diagnostic machines', 'MAGHREB STEEL — Laminoir à froid', 'taha.alaoui@maghrebsteel.ma', '0661234574', 'MS-4148', 1, 'Partiellement émargé (Présent Partie 1, non émargé Partie 2 - 6/10 créneaux)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-9', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-9', 'AMASSOUL ABDERRAZZAK', 'MS-109', 'JH10294', '142859302', 'E', 'Technicien d''intervention mécanique', 'MAGHREB STEEL — Fours de réchauffage', 'abderrazzak.amassoul@maghrebsteel.ma', '0661234575', 'MS-0294', 1, 'Non émargé (Absence autorisée mission laboratoire - 0/10 créneaux)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-10', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-10', 'CHABIH SALAH', 'MS-110', 'F494267', '192840591', 'E', 'Technicien équilibrage & lignage', 'MAGHREB STEEL — Atelier mécanique', 'salah.chabih@maghrebsteel.ma', '0661234576', 'MS-4267', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-11', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-11', 'MAKHFI TARIK', 'MS-111', 'W345777', '163950284', 'E', 'Mécanicien d''entretien posté', 'MAGHREB STEEL — Laminoir à chaud', 'tarik.makhfi@maghrebsteel.ma', '0661234577', 'MS-5777', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-12', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-12', 'EL KOUCHE YOUSSEF', 'MS-112', 'BB129244', '178492019', 'E', 'Technicien de surveillance d''état', 'MAGHREB STEEL — Train à fil', 'youssef.elkouche@maghrebsteel.ma', '0661234578', 'MS-9244', 1, 'Partiellement émargé (Présent Partie 1, non émargé Partie 2 - 6/10 créneaux)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-13', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-13', 'EL BOUZI ABDERRAHIM', 'MS-113', 'G687389', '159204812', 'E', 'Agent de maintenance hydraulique', 'MAGHREB STEEL — Aciérie', 'abderrahim.elbouzi@maghrebsteel.ma', '0661234579', 'MS-7389', 1, 'Partiellement émargé (Présent Partie 1, non émargé Partie 2 - 6/10 créneaux)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-14', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-14', 'KHATIMI YOUSSEF', 'MS-114', 'M497711', '184920395', 'E', 'Technicien de maintenance préventive', 'MAGHREB STEEL — Ligne de refendage', 'youssef.khatimi@maghrebsteel.ma', '0661234580', 'MS-7711', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-15', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-15', 'EL MAKKAOUY MOHAMED', 'MS-115', 'I649778', '149307475', 'E', 'Technicien de banc d''essai & révision', 'MAGHREB STEEL — Atelier central', 'mohamed.elmakkaouy@maghrebsteel.ma', '0661234581', 'MS-9778', 1, 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)', '2026-09-10T08:00:00.000Z'),
('trainee-ms-g1-16', 'sess-ms-vcat1-grp1', 'usr-trainee-ms-1-16', 'ABDOU ELMEHDI', 'MS-116', 'BM38257', '113683769', 'C', 'Chef d''équipe maintenance mécanique', 'MAGHREB STEEL — Laminoir à froid', 'elmehdi.abdou@maghrebsteel.ma', '0661234582', 'MS-8257', 1, 'Partiellement émargé (Présent Partie 1, non émargé Partie 2 - 6/10 créneaux)', '2026-09-10T08:00:00.000Z');

-- Initialisation du statut des cours pour les 16 stagiaires (non_commence car examen non encore passé)
INSERT OR REPLACE INTO user_course_status (id, user_id, course_id, status, progress_percent, modules_completed, total_modules, average_quiz_score, exam_score, certified, certified_at, last_activity_at)
SELECT 
    'status_' || u.id || '_vibration_1',
    u.id,
    'vibration_1',
    'non_commence',
    0.0,
    0,
    7,
    0.0,
    NULL,
    0,
    NULL,
    '2026-09-10T08:00:00.000Z'
FROM users u
WHERE u.role = 'eleve';

-- ----------------------------------------------------------------------------
-- 6. FEUILLES D'ÉMARGEMENT & POINTAGE (160 ENREGISTREMENTS MODÈLE 5)
-- Dates de la session : J1=14/09, J2=15/09, J3=16/09 (Partie 1), J4=01/10, J5=02/10 (Partie 2)
-- ----------------------------------------------------------------------------
-- Règle métier officielle Maghreb Steel :
-- - Apprenant 9 (AMASSOUL) : Absent justifié les 5 jours (0/10).
-- - Apprenants 8, 12, 13, 16 : Présents Partie 1 (J1, J2, J3) et Absents autorisés Partie 2 (J4, J5).
-- - Les 11 autres apprenants : Présents 10/10 créneaux.

-- Jours 1, 2, 3 (Partie 1 - 14, 15, 16 Septembre)
INSERT OR REPLACE INTO session_attendance (id, session_id, trainee_id, day_index, date, slot, status, arrival_time, comment, marked_by, marked_at)
SELECT 
    'att_' || st.id || '_d' || days.d || '_' || slots.s,
    st.session_id,
    st.id,
    days.d,
    days.dt,
    slots.s,
    CASE 
        WHEN st.matricule = 'MS-109' THEN 'absent_justifie'
        ELSE 'present'
    END,
    CASE 
        WHEN st.matricule = 'MS-109' THEN NULL
        WHEN slots.s = 'matin' THEN '08:25'
        ELSE '13:28'
    END,
    CASE 
        WHEN st.matricule = 'MS-109' THEN 'Ordre de mission usine'
        ELSE 'Émargement régulier'
    END,
    'M. Mohammed KARMOUD',
    days.dt || 'T08:30:00.000Z'
FROM session_trainees st
CROSS JOIN (
    SELECT 1 as d, '2026-09-14' as dt UNION ALL
    SELECT 2 as d, '2026-09-15' as dt UNION ALL
    SELECT 3 as d, '2026-09-16' as dt
) days
CROSS JOIN (
    SELECT 'matin' as s UNION ALL
    SELECT 'apres_midi' as s
) slots;

-- Jours 4, 5 (Partie 2 - 01, 02 Octobre)
INSERT OR REPLACE INTO session_attendance (id, session_id, trainee_id, day_index, date, slot, status, arrival_time, comment, marked_by, marked_at)
SELECT 
    'att_' || st.id || '_d' || days.d || '_' || slots.s,
    st.session_id,
    st.id,
    days.d,
    days.dt,
    slots.s,
    CASE 
        WHEN st.matricule IN ('MS-108', 'MS-109', 'MS-112', 'MS-113', 'MS-116') THEN 'absent_justifie'
        ELSE 'present'
    END,
    CASE 
        WHEN st.matricule IN ('MS-108', 'MS-109', 'MS-112', 'MS-113', 'MS-116') THEN NULL
        WHEN slots.s = 'matin' THEN '08:26'
        ELSE '13:27'
    END,
    CASE 
        WHEN st.matricule IN ('MS-108', 'MS-109', 'MS-112', 'MS-113', 'MS-116') THEN 'Absence autorisée (reprise partielle)'
        ELSE 'Émargement régulier'
    END,
    'M. Mohammed KARMOUD',
    days.dt || 'T08:30:00.000Z'
FROM session_trainees st
CROSS JOIN (
    SELECT 4 as d, '2026-10-01' as dt UNION ALL
    SELECT 5 as d, '2026-10-02' as dt
) days
CROSS JOIN (
    SELECT 'matin' as s UNION ALL
    SELECT 'apres_midi' as s
) slots;

-- ----------------------------------------------------------------------------
-- 7. PISTE D'AUDIT HORODATÉE (AUDIT TRAIL)
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
VALUES
('log_init_001', 'usr_admin', 'DATABASE_INIT', 'SYSTEM', 'viblab_sqlite_db', 'Initialisation du schéma de données relationnel et des tables système.', '2026-09-01T08:00:00.000Z'),
('log_init_002', 'usr_admin', 'CREATE_SESSION', 'training_sessions', 'sess-ms-vcat1-grp1', 'Création de la session Groupe 1 Maghreb Steel (Tit Mellil).', '2026-09-01T08:15:00.000Z'),
('log_init_003', 'usr_trainer', 'ENROLL_TRAINEES', 'session_trainees', 'sess-ms-vcat1-grp1', 'Import et enregistrement des 16 apprenants certifiés Maghreb Steel.', '2026-09-10T09:00:00.000Z'),
('log_init_004', 'usr_trainer', 'SIGN_ATTENDANCE_P1', 'session_attendance', 'sess-ms-vcat1-grp1', 'Clôture et signature des feuilles de présence Partie 1 (Jours 1 à 3).', '2026-09-16T17:00:00.000Z'),
('log_init_005', 'usr_trainer', 'SIGN_ATTENDANCE_P2', 'session_attendance', 'sess-ms-vcat1-grp1', 'Clôture et signature des feuilles de présence Partie 2 (Jours 4 et 5 - Modèle 5 officiel scellé).', '2026-10-02T17:15:00.000Z');

-- ----------------------------------------------------------------------------
-- 8. ENREGISTREMENT DES MIGRATIONS
-- ----------------------------------------------------------------------------
INSERT OR REPLACE INTO schema_migrations (version, name, applied_at)
VALUES
('001', '001_initial_schema.sql', '2026-10-07T16:00:00.000Z'),
('002', '002_seed_real_data.sql', '2026-10-07T16:05:00.000Z');
