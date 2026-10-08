-- ============================================================================
-- VIBLAB PRO - MIGRATION 001: INITIAL SCHEMA
-- Date: 2026-10-07
-- Description: Création des tables relationnelles, contraintes et index
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 0. TABLE DE SUIVI DES MIGRATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 1. UTILISATEURS & AUTHENTIFICATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('admin', 'formateur', 'eleve')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
);

-- ----------------------------------------------------------------------------
-- 2. CATALOGUE DE COURS & FORMATIONS (ISO 18436-2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    level TEXT NOT NULL,
    category TEXT NOT NULL,
    total_duration_hours REAL DEFAULT 35.0,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 3. MODULES PÉDAGOGIQUES DU COURS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    html_path TEXT NOT NULL,
    html_content TEXT,
    order_index INTEGER NOT NULL,
    duration_min INTEGER DEFAULT 45,
    access_code TEXT,
    trainer_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by TEXT NOT NULL DEFAULT 'system'
);

-- ----------------------------------------------------------------------------
-- 4. PROGRESSION INDIVIDUELLE DES APPRENANTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    completed INTEGER NOT NULL DEFAULT 0,
    progress_percent REAL NOT NULL DEFAULT 0.0,
    last_slide_index INTEGER DEFAULT 0,
    last_viewed_at TEXT,
    score REAL DEFAULT 0.0,
    attempts INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    passed_at TEXT,
    UNIQUE(user_id, module_id)
);

-- ----------------------------------------------------------------------------
-- 5. RÉSULTATS DES QUIZ & QCM (SEUIL 85%)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_quiz_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    module_number INTEGER NOT NULL,
    best_score REAL NOT NULL DEFAULT 0.0,
    attempts INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT NOT NULL DEFAULT (datetime('now')),
    passed_at TEXT,
    UNIQUE(user_id, module_id)
);

-- ----------------------------------------------------------------------------
-- 6. STATUT DE CERTIFICATION DU PARCOURS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_course_status (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'non_commence' CHECK(status IN ('non_commence', 'en_cours', 'termine', 'certifie')),
    progress_percent REAL NOT NULL DEFAULT 0.0,
    modules_completed INTEGER NOT NULL DEFAULT 0,
    total_modules INTEGER NOT NULL DEFAULT 7,
    average_quiz_score REAL DEFAULT 0.0,
    exam_score REAL,
    certified INTEGER NOT NULL DEFAULT 0,
    certified_at TEXT,
    last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id)
);

-- ----------------------------------------------------------------------------
-- 7. SESSIONS DE FORMATION (ENTREPRISE / GIAC / OFPPT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_sessions (
    id TEXT PRIMARY KEY,
    session_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    course_id TEXT NOT NULL,
    company_name TEXT NOT NULL DEFAULT 'MAGHREB STEEL',
    action_theme TEXT NOT NULL DEFAULT 'Analyse des vibrations niveau 1',
    trainer_name TEXT NOT NULL,
    site_location TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 5,
    status TEXT NOT NULL CHECK(status IN ('planned', 'in_progress', 'completed', 'archived')),
    is_multi_part INTEGER DEFAULT 0,
    parts_json TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 8. RÉPERTOIRE DES APPRENANTS INSCRITS AUX SESSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_trainees (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    matricule TEXT NOT NULL,
    cin TEXT,
    cnss TEXT,
    csp TEXT CHECK(csp IN ('C', 'E', 'O')),
    job_title TEXT NOT NULL DEFAULT '',
    site_entity TEXT NOT NULL DEFAULT 'MAGHREB STEEL',
    email TEXT NOT NULL,
    phone TEXT,
    access_code TEXT NOT NULL,
    course_access_granted INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 9. FEUILLES D'ÉMARGEMENT & POINTAGE OFFICIEL (MODÈLE 5)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_attendance (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    trainee_id TEXT NOT NULL REFERENCES session_trainees(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK(day_index BETWEEN 1 AND 30),
    date TEXT NOT NULL,
    slot TEXT NOT NULL CHECK(slot IN ('matin', 'apres_midi')),
    status TEXT NOT NULL CHECK(status IN ('present', 'retard', 'absent_justifie', 'absent_injustifie')),
    arrival_time TEXT,
    comment TEXT,
    marked_by TEXT NOT NULL,
    marked_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, trainee_id, day_index, slot)
);

-- ----------------------------------------------------------------------------
-- 10. JOURNAL D'AUDIT HORODATÉ & TRAÇABILITÉ QUALITÉ
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- INDEX DE PERFORMANCE & DE RECHERCHE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user ON user_quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_course_status_user ON user_course_status(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON training_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_trainees_session ON session_trainees(session_id);
CREATE INDEX IF NOT EXISTS idx_trainees_matricule ON session_trainees(matricule);
CREATE INDEX IF NOT EXISTS idx_attendance_session_day ON session_attendance(session_id, day_index);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON session_attendance(trainee_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
