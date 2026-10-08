import initSqlJs, { Database, SqlValue } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { 
  User, 
  CourseData, 
  CourseModule, 
  UserProgress, 
  AuditLog, 
  UserQuizResult, 
  UserCourseStatus, 
  UserLearningSummary 
} from '../types/course';
import { INITIAL_COURSES } from '../utils/defaultCourses';

const IDB_NAME = 'viblab_sqlite_db';
const IDB_STORE = 'sqlite_binary';
const IDB_KEY = 'current_db';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

// IndexedDB persistence helpers
function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIndexedDb(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(data, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to persist SQLite to IndexedDB:', err);
  }
}

async function loadFromIndexedDb(): Promise<Uint8Array | null> {
  try {
    const idb = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        if (req.result instanceof Uint8Array) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load SQLite from IndexedDB:', err);
    return null;
  }
}

/**
 * Initializes the SQLite database via WebAssembly, creating tables and inserting seed data if empty.
 */
export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl
      });

      const existingData = await loadFromIndexedDb();
      if (existingData && existingData.length > 0) {
        dbInstance = new SQL.Database(existingData);
      } else {
        dbInstance = new SQL.Database();
      }

      // Initialize schema
      initSchema(dbInstance);

      // Ensure complete database integrity across all tables (users, sessions, trainees, attendance, course status)
      await ensureFullDatabaseIntegrity(dbInstance);

      return dbInstance;
    } catch (err) {
      console.warn('WASM locateFile error, trying root path fallback:', err);
      try {
        const SQL = await initSqlJs({
          locateFile: () => '/sql-wasm.wasm'
        });
        dbInstance = new SQL.Database();
        initSchema(dbInstance);
        await ensureFullDatabaseIntegrity(dbInstance);
        return dbInstance;
      } catch (err2) {
        console.error('Fatal: SQLite WASM cannot load in this environment:', err2);
        throw err2;
      }
    }
  })();

  return initPromise;
}

function initSchema(db: Database) {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'formateur', 'eleve')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      level TEXT NOT NULL,
      category TEXT NOT NULL,
      total_duration_hours REAL DEFAULT 35,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      completed INTEGER NOT NULL DEFAULT 0,
      progress_percent REAL NOT NULL DEFAULT 0,
      last_slide_index INTEGER DEFAULT 0,
      last_viewed_at TEXT,
      score REAL DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      passed INTEGER DEFAULT 0,
      passed_at TEXT,
      UNIQUE(user_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS user_quiz_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      module_id TEXT NOT NULL,
      module_number INTEGER NOT NULL,
      best_score REAL NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT NOT NULL,
      passed_at TEXT,
      UNIQUE(user_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS user_course_status (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'en_cours',
      progress_percent REAL NOT NULL DEFAULT 0,
      modules_completed INTEGER NOT NULL DEFAULT 0,
      total_modules INTEGER NOT NULL DEFAULT 7,
      average_quiz_score REAL DEFAULT 0,
      exam_score REAL,
      certified INTEGER NOT NULL DEFAULT 0,
      certified_at TEXT,
      last_activity_at TEXT NOT NULL,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );

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
      total_days INTEGER NOT NULL,
      status TEXT NOT NULL,
      is_multi_part INTEGER DEFAULT 0,
      parts_json TEXT,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_trainees (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT,
      full_name TEXT NOT NULL,
      matricule TEXT NOT NULL,
      cin TEXT,
      cnss TEXT,
      csp TEXT,
      job_title TEXT NOT NULL DEFAULT '',
      site_entity TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      access_code TEXT NOT NULL,
      course_access_granted INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_attendance (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      trainee_id TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      status TEXT NOT NULL,
      arrival_time TEXT,
      comment TEXT,
      marked_by TEXT NOT NULL,
      marked_at TEXT NOT NULL,
      UNIQUE(session_id, trainee_id, day_index, slot)
    );

    CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_user ON user_quiz_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_course_status_user ON user_course_status(user_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_session ON session_attendance(session_id, day_index);
    CREATE INDEX IF NOT EXISTS idx_trainees_session ON session_trainees(session_id);
  `;
  db.run(schemaSql);

  // Safe migrations for columns if user_progress table was previously created
  try { db.run("ALTER TABLE user_progress ADD COLUMN score REAL DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE user_progress ADD COLUMN attempts INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE user_progress ADD COLUMN passed INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.run("ALTER TABLE user_progress ADD COLUMN passed_at TEXT;"); } catch (e) {}
}

function seedInitialData(db: Database) {
  const now = new Date().toISOString();

  // 1. Purge any invented OCP users
  try {
    db.run(`
      DELETE FROM users 
      WHERE email LIKE '%@ocpms.ma%' 
         OR email LIKE '%@ocp-ms.com%' 
         OR username = 'eleve' 
         OR full_name LIKE '%Promotion 2026%' 
         OR full_name LIKE '%Étudiant Apprenant%'
         OR id = 'usr_student_1' 
         OR id = 'usr_admin_1' 
         OR id = 'usr_trainer_1';
    `);
  } catch (e) {}

  // Seed ONLY the 2 system users: Admin & Formateur
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);
  `);

  insertUser.run([
    'usr_admin',
    'admin',
    'AdminVibLab2026!',
    'M. Amine SALAMAT (Gestionnaire Formation)',
    'amine.salamat@maghrebsteel.ma',
    'admin',
    now,
    now
  ]);

  insertUser.run([
    'usr_trainer',
    'mkarmoud',
    'KarmoudVibe2026!',
    'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
    'mohammed.karmoud@viblab.com',
    'formateur',
    now,
    null
  ]);

  insertUser.free();

  // 2. Seed Default Course (Niveau 1)
  const defaultCourse = INITIAL_COURSES[0];
  const courseId = defaultCourse.id || 'vibration_1';

  const insertCourse = db.prepare(`
    INSERT OR REPLACE INTO courses (id, title, subtitle, description, level, category, total_duration_hours, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?);
  `);
  insertCourse.run([
    courseId,
    defaultCourse.title,
    'Formation Certifiante selon ISO 18436-2 — OCP Maintenance Solutions',
    defaultCourse.desc,
    'Niveau 1',
    'Analyse Vibratoire',
    35.0,
    '2026-01-15T08:00:00.000Z',
    now
  ]);
  insertCourse.free();

  // 3. Seed Default 7 Modules
  const insertModule = db.prepare(`
    INSERT OR REPLACE INTO modules (id, course_id, title, subtitle, html_path, html_content, order_index, duration_min, access_code, trainer_notes, created_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  defaultCourse.modules.forEach((mod, idx) => {
    insertModule.run([
      mod.id,
      courseId,
      mod.title,
      mod.subtitle || '',
      mod.htmlUrl || mod.htmlPath || `/courses/niveau1/${mod.id}.html`,
      mod.htmlContent || null,
      idx + 1,
      mod.durationMin || (45 + idx * 5),
      mod.password || 'OCPms2026@',
      mod.trainerNotes || '',
      '2026-01-15T08:00:00.000Z',
      now,
      'admin'
    ]);
  });
  insertModule.free();

  // 4. Initial progress for eleve
  const insertProgress = db.prepare(`
    INSERT OR REPLACE INTO user_progress (id, user_id, module_id, completed, progress_percent, last_slide_index, last_viewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `);
  defaultCourse.modules.forEach((mod, idx) => {
    insertProgress.run([
      `prog_student_${mod.id}`,
      'usr_student_1',
      mod.id,
      idx === 0 ? 1 : (idx === 1 ? 0 : 0),
      idx === 0 ? 100 : (idx === 1 ? 40 : 0),
      idx === 0 ? 33 : (idx === 1 ? 8 : 1),
      now
    ]);
  });
  insertProgress.free();

  // 5. Initial Audit Log
  const insertLog = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `);
  insertLog.run([
    'log_init_01',
    'usr_admin_1',
    'DATABASE_INIT',
    'SYSTEM',
    'viblab_sqlite_db',
    'Base de données SQLite initialisée avec 3 utilisateurs et 7 modules Niveau 1.',
    now
  ]);
  insertLog.free();

  // Seed course status & quiz results
  seedInitialCourseAndQuizStatus(db);
}

/**
 * Persist current state of SQLite DB to IndexedDB
 */
export async function persistDb(): Promise<void> {
  if (!dbInstance) return;
  const binaryData = dbInstance.export();
  await saveToIndexedDb(binaryData);
}

// ==========================================
// USER CRUD OPERATIONS
// ==========================================

export async function getUsers(): Promise<User[]> {
  const db = await getSqliteDb();
  const res = db.exec(`
    SELECT id, username, full_name, email, role, is_active, created_at, last_login_at 
    FROM users 
    ORDER BY created_at ASC;
  `);
  if (res.length === 0) return [];
  const rows = res[0].values;
  return rows.map((r) => ({
    id: String(r[0]),
    username: String(r[1]),
    fullName: String(r[2]),
    email: String(r[3] || ''),
    role: String(r[4]) as any,
    isActive: Boolean(r[5]),
    createdAt: String(r[6]),
    lastLoginAt: r[7] ? String(r[7]) : undefined
  }));
}

export async function getUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
  const db = await getSqliteDb();
  const cleaned = username.trim();
  const stmt = db.prepare(`
    SELECT u.id, u.username, u.password_hash, u.full_name, u.email, u.role, u.is_active, u.created_at, u.last_login_at 
    FROM users u
    LEFT JOIN session_trainees st ON (st.user_id = u.id OR LOWER(st.email) = LOWER(u.email))
    WHERE LOWER(u.username) = LOWER(?) 
       OR LOWER(u.email) = LOWER(?) 
       OR LOWER(u.id) = LOWER(?) 
       OR LOWER(COALESCE(st.matricule, '')) = LOWER(?)
    LIMIT 1;
  `);
  stmt.bind([cleaned, cleaned, cleaned, cleaned]);
  if (stmt.step()) {
    const r = stmt.get();
    stmt.free();
    return {
      id: String(r[0]),
      username: String(r[1]),
      passwordHash: String(r[2]),
      fullName: String(r[3]),
      email: String(r[4] || ''),
      role: String(r[5]) as any,
      isActive: Boolean(r[6]),
      createdAt: String(r[7]),
      lastLoginAt: r[8] ? String(r[8]) : undefined
    };
  }
  stmt.free();
  return null;
}

export async function createUser(user: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: 'admin' | 'formateur' | 'eleve';
}): Promise<User> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const stmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, email, role, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?);
  `);
  stmt.run([id, user.username.trim(), user.password, user.fullName.trim(), user.email.trim(), user.role, now]);
  stmt.free();

  await logAuditAction('CURRENT_USER', 'CREATE_USER', 'users', id, `Nouvel utilisateur créé: ${user.username} (${user.role})`);
  await persistDb();

  return {
    id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: true,
    createdAt: now
  };
}

export async function updateUser(id: string, updates: Partial<{
  fullName: string;
  email: string;
  role: 'admin' | 'formateur' | 'eleve';
  password: string;
  isActive: boolean;
}>): Promise<void> {
  const db = await getSqliteDb();
  const sets: string[] = [];
  const params: SqlValue[] = [];

  if (updates.fullName !== undefined) {
    sets.push('full_name = ?');
    params.push(updates.fullName);
  }
  if (updates.email !== undefined) {
    sets.push('email = ?');
    params.push(updates.email);
  }
  if (updates.role !== undefined) {
    sets.push('role = ?');
    params.push(updates.role);
  }
  if (updates.password !== undefined && updates.password.trim() !== '') {
    sets.push('password_hash = ?');
    params.push(updates.password);
  }
  if (updates.isActive !== undefined) {
    sets.push('is_active = ?');
    params.push(updates.isActive ? 1 : 0);
  }

  if (sets.length === 0) return;
  params.push(id);

  const query = `UPDATE users SET ${sets.join(', ')} WHERE id = ?;`;
  const stmt = db.prepare(query);
  stmt.run(params);
  stmt.free();

  await logAuditAction('CURRENT_USER', 'UPDATE_USER', 'users', id, `Utilisateur mis à jour: ${JSON.stringify(updates)}`);
  await persistDb();
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getSqliteDb();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?;');
  stmt.run([id]);
  stmt.free();

  await logAuditAction('CURRENT_USER', 'DELETE_USER', 'users', id, `Utilisateur supprimé: ID ${id}`);
  await persistDb();
}

export async function updateLastLogin(id: string): Promise<void> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?;');
  stmt.run([now, id]);
  stmt.free();
  await persistDb();
}

// ==========================================
// COURSE & MODULE OPERATIONS
// ==========================================

export async function getCourseData(courseId = 'vibration_1'): Promise<CourseData> {
  const db = await getSqliteDb();

  // Course row
  const cRes = db.exec(`SELECT id, title, subtitle, description, level, category, total_duration_hours FROM courses WHERE id = '${courseId}' LIMIT 1;`);
  let courseMeta = {
    id: courseId,
    title: 'Vibrations Niveau 1 — Formation Certifiante ISO 18436-2',
    subtitle: 'Support officiel de formation OCP Maintenance Solutions',
    desc: 'Comprendre et maîtriser la surveillance et l’analyse vibratoire des machines tournantes.',
    level: 'Niveau 1',
    category: 'Analyse Vibratoire'
  };
  if (cRes.length > 0 && cRes[0].values.length > 0) {
    const row = cRes[0].values[0];
    courseMeta = {
      id: String(row[0]),
      title: String(row[1]),
      subtitle: String(row[2] || ''),
      desc: String(row[3] || ''),
      level: String(row[4] || 'Niveau 1'),
      category: String(row[5] || 'Analyse Vibratoire')
    };
  }

  // Modules rows
  const mRes = db.exec(`
    SELECT id, course_id, title, subtitle, html_path, html_content, order_index, duration_min, access_code, trainer_notes, created_at, updated_at, updated_by
    FROM modules 
    WHERE course_id = '${courseId}'
    ORDER BY order_index ASC;
  `);

  const modules: CourseModule[] = [];
  if (mRes.length > 0 && mRes[0].values.length > 0) {
    for (const r of mRes[0].values) {
      modules.push({
        id: String(r[0]),
        courseId: String(r[1]),
        title: String(r[2]),
        subtitle: String(r[3] || ''),
        type: 'html',
        htmlPath: String(r[4]),
        htmlUrl: String(r[4]),
        htmlContent: r[5] ? String(r[5]) : undefined,
        orderIndex: Number(r[6]),
        durationMin: Number(r[7] || 45),
        password: String(r[8] || 'OCPms2026@'),
        accessCode: String(r[8] || 'OCPms2026@'),
        trainerNotes: String(r[9] || ''),
        createdAt: String(r[10]),
        dateAdded: String(r[10]),
        dateUpdated: String(r[11]),
        updatedAt: String(r[11]),
        updatedBy: String(r[12] || 'admin'),
        author: String(r[12] || 'Expert OCP MS')
      });
    }
  }

  return {
    id: courseMeta.id,
    title: courseMeta.title,
    subtitle: courseMeta.subtitle,
    desc: courseMeta.desc,
    badge: 'ISO 18436-2',
    color: '#0070C0',
    duration: '35 heures (5 jours)',
    target: 'Techniciens, Ingénieurs de fiabilité, Formateurs et Spécialistes CBM',
    prerequisites: 'Bases en mécanique générale et machines tournantes',
    objectives: [
      'Maîtriser les principes de physique des vibrations et grandeurs de mesure',
      'Sélectionner et positionner correctement les capteurs selon la machine',
      'Appliquer les normes internationales ISO 10816 / ISO 20816',
      'Identifier avec précision les défauts : balourd, désalignement, jeu, roulement',
      'Établir un diagnostic fiable et rédiger un rapport d’expertise industrielle'
    ],
    chapters: modules.map((m, idx) => ({
      num: String(idx + 1).padStart(2, '0'),
      title: m.title,
      duration: `${m.durationMin || 45} min`
    })),
    modules: modules
  };
}

export async function getAllCourses(): Promise<CourseData[]> {
  const db = await getSqliteDb();
  const res = db.exec(`SELECT id FROM courses ORDER BY created_at ASC;`);
  if (res.length === 0 || res[0].values.length === 0) {
    const defaultData = await getCourseData('vibration_1');
    return [defaultData];
  }

  const courses: CourseData[] = [];
  for (const row of res[0].values) {
    const courseId = String(row[0]);
    const courseData = await getCourseData(courseId);
    courses.push(courseData);
  }
  return courses;
}

export async function createCourse(data: {
  id?: string;
  title: string;
  subtitle?: string;
  desc?: string;
  level?: string;
  category?: string;
  duration?: string;
  badge?: string;
}): Promise<CourseData> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const id = data.id || `course_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const stmt = db.prepare(`
    INSERT INTO courses (id, title, subtitle, description, level, category, total_duration_hours, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?);
  `);
  stmt.run([
    id,
    data.title.trim(),
    (data.subtitle || '').trim(),
    (data.desc || '').trim(),
    data.level || 'Niveau 1',
    data.category || 'Analyse Vibratoire',
    35.0,
    now,
    now
  ]);
  stmt.free();

  await logAuditAction('CURRENT_USER', 'CREATE_COURSE', 'courses', id, `Nouveau cours créé: "${data.title}"`);
  await persistDb();

  return getCourseData(id);
}

export async function deleteCourse(courseId: string): Promise<void> {
  if (courseId === 'vibration_1') {
    throw new Error('Le cours principal Niveau 1 ne peut pas être supprimé.');
  }
  const db = await getSqliteDb();
  const stmtMod = db.prepare('DELETE FROM modules WHERE course_id = ?;');
  stmtMod.run([courseId]);
  stmtMod.free();

  const stmt = db.prepare('DELETE FROM courses WHERE id = ?;');
  stmt.run([courseId]);
  stmt.free();

  await logAuditAction('CURRENT_USER', 'DELETE_COURSE', 'courses', courseId, `Cours et ses modules supprimés: ID ${courseId}`);
  await persistDb();
}

export async function addModule(courseId: string, moduleData: {
  title: string;
  subtitle: string;
  htmlPath: string;
  htmlContent?: string;
  durationMin?: number;
  accessCode?: string;
  trainerNotes?: string;
  updatedBy?: string;
}): Promise<CourseModule> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const id = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Find next order_index
  const maxOrderRes = db.exec(`SELECT COALESCE(MAX(order_index), 0) + 1 FROM modules WHERE course_id = '${courseId}';`);
  const nextOrder = maxOrderRes.length > 0 && maxOrderRes[0].values.length > 0 ? (maxOrderRes[0].values[0][0] as number) : 1;

  const stmt = db.prepare(`
    INSERT INTO modules (id, course_id, title, subtitle, html_path, html_content, order_index, duration_min, access_code, trainer_notes, created_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  stmt.run([
    id,
    courseId,
    moduleData.title.trim(),
    (moduleData.subtitle || '').trim(),
    moduleData.htmlPath.trim(),
    moduleData.htmlContent || null,
    nextOrder,
    moduleData.durationMin || 45,
    moduleData.accessCode || 'OCPms2026@',
    moduleData.trainerNotes || '',
    now,
    now,
    moduleData.updatedBy || 'admin'
  ]);
  stmt.free();

  await logAuditAction(moduleData.updatedBy || 'admin', 'ADD_MODULE', 'modules', id, `Ajout du module "${moduleData.title}" (${moduleData.htmlPath})`);
  await persistDb();

  return {
    id,
    courseId,
    title: moduleData.title,
    subtitle: moduleData.subtitle,
    type: 'html',
    htmlPath: moduleData.htmlPath,
    htmlUrl: moduleData.htmlPath,
    htmlContent: moduleData.htmlContent,
    orderIndex: nextOrder,
    durationMin: moduleData.durationMin || 45,
    password: moduleData.accessCode || 'OCPms2026@',
    accessCode: moduleData.accessCode || 'OCPms2026@',
    trainerNotes: moduleData.trainerNotes || '',
    createdAt: now,
    dateAdded: now,
    dateUpdated: now,
    updatedAt: now,
    updatedBy: moduleData.updatedBy || 'admin'
  };
}

export async function updateModule(id: string, updates: Partial<{
  title: string;
  subtitle: string;
  htmlPath: string;
  htmlContent: string;
  durationMin: number;
  accessCode: string;
  trainerNotes: string;
  orderIndex: number;
  updatedBy: string;
}>): Promise<void> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const params: SqlValue[] = [now];

  if (updates.title !== undefined) {
    sets.push('title = ?');
    params.push(updates.title);
  }
  if (updates.subtitle !== undefined) {
    sets.push('subtitle = ?');
    params.push(updates.subtitle);
  }
  if (updates.htmlPath !== undefined) {
    sets.push('html_path = ?');
    params.push(updates.htmlPath);
  }
  if (updates.htmlContent !== undefined) {
    sets.push('html_content = ?');
    params.push(updates.htmlContent);
  }
  if (updates.durationMin !== undefined) {
    sets.push('duration_min = ?');
    params.push(updates.durationMin);
  }
  if (updates.accessCode !== undefined) {
    sets.push('access_code = ?');
    params.push(updates.accessCode);
  }
  if (updates.trainerNotes !== undefined) {
    sets.push('trainer_notes = ?');
    params.push(updates.trainerNotes);
  }
  if (updates.orderIndex !== undefined) {
    sets.push('order_index = ?');
    params.push(updates.orderIndex);
  }
  if (updates.updatedBy !== undefined) {
    sets.push('updated_by = ?');
    params.push(updates.updatedBy);
  }

  params.push(id);
  const query = `UPDATE modules SET ${sets.join(', ')} WHERE id = ?;`;
  const stmt = db.prepare(query);
  stmt.run(params);
  stmt.free();

  await logAuditAction(updates.updatedBy || 'admin', 'UPDATE_MODULE', 'modules', id, `Module mis à jour: ID ${id}`);
  await persistDb();
}

export async function deleteModule(id: string, updatedBy = 'admin'): Promise<void> {
  const db = await getSqliteDb();
  const stmt = db.prepare('DELETE FROM modules WHERE id = ?;');
  stmt.run([id]);
  stmt.free();

  await logAuditAction(updatedBy, 'DELETE_MODULE', 'modules', id, `Module supprimé: ID ${id}`);
  await persistDb();
}

export async function reorderModules(courseId: string, orderedModuleIds: string[]): Promise<void> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  db.run('BEGIN TRANSACTION;');
  try {
    const stmt = db.prepare('UPDATE modules SET order_index = ?, updated_at = ? WHERE id = ? AND course_id = ?;');
    orderedModuleIds.forEach((modId, idx) => {
      stmt.run([idx + 1, now, modId, courseId]);
    });
    stmt.free();
    db.run('COMMIT;');
  } catch (err) {
    db.run('ROLLBACK;');
    throw err;
  }
  await persistDb();
}

// ==========================================
// USER PROGRESS
// ==========================================

export async function getUserProgress(userId: string): Promise<Record<string, UserProgress>> {
  const db = await getSqliteDb();
  const res = db.exec(`
    SELECT id, user_id, module_id, completed, progress_percent, last_slide_index, last_viewed_at
    FROM user_progress 
    WHERE user_id = '${userId}';
  `);
  const map: Record<string, UserProgress> = {};
  if (res.length > 0 && res[0].values.length > 0) {
    for (const r of res[0].values) {
      const p: UserProgress = {
        id: String(r[0]),
        userId: String(r[1]),
        moduleId: String(r[2]),
        completed: Boolean(r[3]),
        progressPercent: Number(r[4] || 0),
        lastSlideIndex: Number(r[5] || 0),
        lastViewedAt: String(r[6] || '')
      };
      map[p.moduleId] = p;
    }
  }
  return map;
}

export async function saveUserProgress(
  userId: string,
  moduleId: string,
  completed: boolean,
  progressPercent: number,
  lastSlideIndex = 0
): Promise<void> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const id = `prog_${userId}_${moduleId}`;

  const stmt = db.prepare(`
    INSERT INTO user_progress (id, user_id, module_id, completed, progress_percent, last_slide_index, last_viewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, module_id) DO UPDATE SET
      completed = excluded.completed,
      progress_percent = excluded.progress_percent,
      last_slide_index = excluded.last_slide_index,
      last_viewed_at = excluded.last_viewed_at;
  `);

  stmt.run([id, userId, moduleId, completed ? 1 : 0, progressPercent, lastSlideIndex, now]);
  stmt.free();
  await persistDb();
}

// ==========================================
// COURSE PASS / FAIL, QUIZ RESULTS & SUMMARY
// ==========================================

export async function saveQuizResult(
  userId: string,
  moduleNum: number,
  score: number,
  passed: boolean,
  courseId: string = 'vibration_1'
): Promise<UserQuizResult> {
  const db = await getSqliteDb();
  const now = new Date().toISOString();
  const moduleId = `mod_${moduleNum}`;
  const id = `quiz_${userId}_mod${moduleNum}`;

  // 1. Check existing attempts & best score
  let attempts = 1;
  let bestScore = score;
  const existing = db.exec(`
    SELECT attempts, best_score, passed FROM user_quiz_results
    WHERE user_id = '${userId}' AND (module_number = ${moduleNum} OR module_id = '${moduleId}');
  `);
  if (existing.length > 0 && existing[0].values.length > 0) {
    const prevAttempts = Number(existing[0].values[0][0] || 0);
    const prevBest = Number(existing[0].values[0][1] || 0);
    const prevPassed = Boolean(existing[0].values[0][2]);
    attempts = prevAttempts + 1;
    bestScore = Math.max(prevBest, score);
    passed = passed || prevPassed;
  }

  // 2. Insert/replace into user_quiz_results
  db.run(`
    INSERT OR REPLACE INTO user_quiz_results (id, user_id, module_id, module_number, best_score, attempts, passed, last_attempt_at, passed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [
    id,
    userId,
    moduleId,
    moduleNum,
    bestScore,
    attempts,
    passed ? 1 : 0,
    now,
    passed ? now : null
  ]);

  // 3. Update user_progress
  db.run(`
    INSERT OR REPLACE INTO user_progress (id, user_id, module_id, completed, progress_percent, last_slide_index, last_viewed_at, score, attempts, passed, passed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [
    `prog_${userId}_${moduleId}`,
    userId,
    moduleId,
    passed ? 1 : 0,
    passed ? 100 : Math.min(95, Math.round((score / 85) * 80)),
    0,
    now,
    bestScore,
    attempts,
    passed ? 1 : 0,
    passed ? now : null
  ]);

  // 4. Update overall user_course_status
  await recalculateUserCourseStatus(db, userId, courseId);

  // 5. Add audit log
  await logAuditAction(
    userId,
    passed ? 'QUIZ_PASSE_VALIDE' : 'QUIZ_TENTATIVE_ECHOUEE',
    'quiz',
    moduleId,
    `QCM Module ${moduleNum} par ${userId}. Score: ${score}%. Meilleur score: ${bestScore}%. Statut: ${passed ? 'RÉUSSI (≥85%)' : 'NON VALIDÉ (<85%)'}. Tentative #${attempts}.`
  );

  await persistDb();

  return {
    id,
    userId,
    moduleId,
    moduleNumber: moduleNum,
    bestScore,
    attempts,
    passed,
    lastAttemptAt: now,
    passedAt: passed ? now : undefined
  };
}

export async function getUserQuizResults(userId: string): Promise<Record<number, UserQuizResult>> {
  const db = await getSqliteDb();
  const res = db.exec(`
    SELECT id, user_id, module_id, module_number, best_score, attempts, passed, last_attempt_at, passed_at
    FROM user_quiz_results
    WHERE user_id = '${userId}';
  `);
  const map: Record<number, UserQuizResult> = {};
  if (res.length > 0 && res[0].values.length > 0) {
    for (const r of res[0].values) {
      const q: UserQuizResult = {
        id: String(r[0]),
        userId: String(r[1]),
        moduleId: String(r[2]),
        moduleNumber: Number(r[3]),
        bestScore: Number(r[4] || 0),
        attempts: Number(r[5] || 1),
        passed: Boolean(r[6]),
        lastAttemptAt: String(r[7] || ''),
        passedAt: r[8] ? String(r[8]) : undefined
      };
      map[q.moduleNumber] = q;
    }
  }
  return map;
}

export async function getUserCourseStatus(userId: string, courseId: string = 'vibration_1'): Promise<UserCourseStatus | null> {
  const db = await getSqliteDb();
  const res = db.exec(`
    SELECT id, user_id, course_id, status, progress_percent, modules_completed, total_modules, average_quiz_score, exam_score, certified, certified_at, last_activity_at
    FROM user_course_status
    WHERE user_id = '${userId}' AND course_id = '${courseId}';
  `);
  if (res.length === 0 || res[0].values.length === 0) return null;
  const r = res[0].values[0];
  return {
    id: String(r[0]),
    userId: String(r[1]),
    courseId: String(r[2]),
    status: r[3] as any,
    progressPercent: Number(r[4] || 0),
    modulesCompleted: Number(r[5] || 0),
    totalModules: Number(r[6] || 7),
    averageQuizScore: Number(r[7] || 0),
    examScore: r[8] !== null ? Number(r[8]) : undefined,
    certified: Boolean(r[9]),
    certifiedAt: r[10] ? String(r[10]) : undefined,
    lastActivityAt: String(r[11] || '')
  };
}

export async function recalculateUserCourseStatus(db: Database, userId: string, courseId: string = 'vibration_1'): Promise<UserCourseStatus> {
  const now = new Date().toISOString();
  const qRes = db.exec(`
    SELECT module_number, best_score, passed FROM user_quiz_results
    WHERE user_id = '${userId}';
  `);
  
  let modulesCompleted = 0;
  let totalScore = 0;
  let scoreCount = 0;
  const totalModules = 7;

  if (qRes.length > 0 && qRes[0].values.length > 0) {
    for (const row of qRes[0].values) {
      const score = Number(row[1] || 0);
      const passed = Boolean(row[2]);
      if (passed) modulesCompleted++;
      totalScore += score;
      scoreCount++;
    }
  }

  const averageQuizScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : 0;
  const progressPercent = Math.round((modulesCompleted / totalModules) * 100);
  const isCertified = modulesCompleted >= totalModules && averageQuizScore >= 85;
  const status: 'non_commence' | 'en_cours' | 'termine_valide' | 'echoue' = 
    modulesCompleted >= totalModules ? 'termine_valide' : (scoreCount > 0 || progressPercent > 0 ? 'en_cours' : 'non_commence');

  const id = `status_${userId}_${courseId}`;

  db.run(`
    INSERT OR REPLACE INTO user_course_status (id, user_id, course_id, status, progress_percent, modules_completed, total_modules, average_quiz_score, certified, certified_at, last_activity_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [
    id,
    userId,
    courseId,
    status,
    progressPercent,
    modulesCompleted,
    totalModules,
    averageQuizScore,
    isCertified ? 1 : 0,
    isCertified ? now : null,
    now
  ]);

  return {
    id,
    userId,
    courseId,
    status,
    progressPercent,
    modulesCompleted,
    totalModules,
    averageQuizScore,
    certified: isCertified,
    certifiedAt: isCertified ? now : undefined,
    lastActivityAt: now
  };
}

export async function getAllUsersCourseAndAttendanceSummary(): Promise<UserLearningSummary[]> {
  const db = await getSqliteDb();
  
  // 1. Get users with roles
  const usersRes = db.exec(`
    SELECT u.id, u.full_name, u.username, u.email, u.role,
           t.matricule, t.session_id, s.session_code, s.title
    FROM users u
    LEFT JOIN session_trainees t ON (t.user_id = u.id OR t.id = u.id OR t.email = u.email)
    LEFT JOIN training_sessions s ON s.id = t.session_id
    ORDER BY u.full_name ASC;
  `);

  if (usersRes.length === 0 || usersRes[0].values.length === 0) return [];

  const summaries: UserLearningSummary[] = [];

  for (const row of usersRes[0].values) {
    const userId = String(row[0]);
    const fullName = String(row[1]);
    const username = String(row[2]);
    const email = String(row[3] || '');
    const role = String(row[4]) as any;
    const matricule = row[5] ? String(row[5]) : undefined;
    const sessionId = row[6] ? String(row[6]) : undefined;
    const sessionCode = row[7] ? String(row[7]) : undefined;
    const sessionTitle = row[8] ? String(row[8]) : undefined;

    // Attendance query for this user/trainee
    let totalExpectedSlots = 0;
    let presentSlots = 0;
    let lastAttendanceDate: string | undefined;

    const attRes = db.exec(`
      SELECT COUNT(*) as total,
             COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) as presents,
             MAX(a.date) as last_date
      FROM session_attendance a
      JOIN session_trainees t ON a.trainee_id = t.id
      WHERE t.user_id = '${userId}' OR t.email = '${email}' OR t.id = '${userId}' OR a.trainee_id = '${userId}';
    `);
    if (attRes.length > 0 && attRes[0].values.length > 0) {
      totalExpectedSlots = Number(attRes[0].values[0][0] || 0);
      presentSlots = Number(attRes[0].values[0][1] || 0);
      lastAttendanceDate = attRes[0].values[0][2] ? String(attRes[0].values[0][2]) : undefined;
    }

    const attendanceRate = totalExpectedSlots > 0 ? Math.round((presentSlots / totalExpectedSlots) * 1000) / 10 : 0;

    // Course status query from SQLite
    const statusRes = db.exec(`
      SELECT status, progress_percent, modules_completed, total_modules, average_quiz_score, certified, certified_at
      FROM user_course_status
      WHERE user_id = '${userId}';
    `);

    let courseStatus: 'non_commence' | 'en_cours' | 'termine_valide' | 'echoue' = 'non_commence';
    let progressPercent = 0;
    let modulesCompleted = 0;
    let totalModules = 7;
    let averageQuizScore = 0;
    let certified = false;
    let certifiedAt: string | undefined;

    if (statusRes.length > 0 && statusRes[0].values.length > 0) {
      const sRow = statusRes[0].values[0];
      courseStatus = sRow[0] as any;
      progressPercent = Number(sRow[1] || 0);
      modulesCompleted = Number(sRow[2] || 0);
      totalModules = Number(sRow[3] || 7);
      averageQuizScore = Number(sRow[4] || 0);
      certified = Boolean(sRow[5]);
      certifiedAt = sRow[6] ? String(sRow[6]) : undefined;
    }

    const hasPassedCourse = courseStatus === 'termine_valide' || (modulesCompleted >= totalModules && averageQuizScore >= 85);

    summaries.push({
      userId,
      fullName,
      username,
      email,
      role,
      matricule,
      sessionId,
      sessionCode,
      sessionTitle,
      totalExpectedSlots,
      presentSlots,
      attendanceRate,
      lastAttendanceDate,
      courseStatus,
      progressPercent,
      modulesCompleted,
      totalModules,
      averageQuizScore,
      certified,
      certifiedAt,
      hasPassedCourse
    });
  }

  return summaries;
}

export const REAL_MAGHREB_STEEL_USERS_DATA = [
  { idx: 1, name: 'BOUASSA ROUCHDI', mat: 'MS-101', cin: 'BJ218263', cnss: '164591061', csp: 'E', email: 'rouchdi.bouassa@maghrebsteel.ma', pass: 'MS-2182' },
  { idx: 2, name: 'KAMAL OUSSAMA', mat: 'MS-102', cin: 'HA234364', cnss: '163135756', csp: 'E', email: 'oussama.kamal@maghrebsteel.ma', pass: 'MS-4364' },
  { idx: 3, name: 'SAIKOUK ABDELLATIF', mat: 'MS-103', cin: 'HA111645', cnss: '192859861', csp: 'E', email: 'abdellatif.saikouk@maghrebsteel.ma', pass: 'MS-1645' },
  { idx: 4, name: 'EL OMARI EL HACEN', mat: 'MS-104', cin: 'T271704', cnss: '117079217', csp: 'E', email: 'elhacen.elomari@maghrebsteel.ma', pass: 'MS-1704' },
  { idx: 5, name: 'BARROUHOU MOUNIR', mat: 'MS-105', cin: 'T214101', cnss: '160089680', csp: 'E', email: 'mounir.barrouhou@maghrebsteel.ma', pass: 'MS-4101' },
  { idx: 6, name: 'EL BERRANI YOUSSEF', mat: 'MS-106', cin: 'BF9409', cnss: '121228955', csp: 'C', email: 'youssef.elberrani@maghrebsteel.ma', pass: 'MS-9409' },
  { idx: 7, name: 'EL HALOUI HAMID', mat: 'MS-107', cin: 'M430833', cnss: '114085080', csp: 'C', email: 'hamid.elhaloui@maghrebsteel.ma', pass: 'MS-0833' },
  { idx: 8, name: 'JAMEL HICHAM', mat: 'MS-108', cin: 'WA196812', cnss: '174344904', csp: 'E', email: 'hicham.jamel@maghrebsteel.ma', pass: 'MS-6812' },
  { idx: 9, name: 'MARJAN SAADIA', mat: 'MS-109', cin: 'HH36169', cnss: '126300156', csp: 'C', email: 'saadia.marjan@maghrebsteel.ma', pass: 'MS-6169' },
  { idx: 10, name: 'CHEBBATE HAMID', mat: 'MS-110', cin: 'BB5418', cnss: '180556750', csp: 'E', email: 'hamid.chebbate@maghrebsteel.ma', pass: 'MS-5418' },
  { idx: 11, name: 'EL MARJANY HAMZA', mat: 'MS-111', cin: 'BB99395', cnss: '174345007', csp: 'E', email: 'hamza.elmarjany@maghrebsteel.ma', pass: 'MS-9395' },
  { idx: 12, name: 'EL MANIAR ABDERRAHIM', mat: 'MS-112', cin: 'I458676', cnss: '142871253', csp: 'C', email: 'abderrahim.elmaniar@maghrebsteel.ma', pass: 'MS-8676' },
  { idx: 13, name: 'FAGOURI MOUNIR', mat: 'MS-113', cin: 'G268741', cnss: '107699939', csp: 'C', email: 'mounir.fagouri@maghrebsteel.ma', pass: 'MS-8741' },
  { idx: 14, name: 'EL ACHARI MOHAMED', mat: 'MS-114', cin: 'W258358', cnss: '197733169', csp: 'E', email: 'mohamed.elachari@maghrebsteel.ma', pass: 'MS-8358' },
  { idx: 15, name: 'EL MAKKAOUY MOHAMED', mat: 'MS-115', cin: 'I649778', cnss: '149307475', csp: 'E', email: 'mohamed.elmakkaouy@maghrebsteel.ma', pass: 'MS-9778' },
  { idx: 16, name: 'ABDOU ELMEHDI', mat: 'MS-116', cin: 'BM38257', cnss: '113683769', csp: 'C', email: 'elmehdi.abdou@maghrebsteel.ma', pass: 'MS-8257' }
];

export function seedMaghrebSteelSessions(db: Database): void {
  const now = new Date().toISOString();
  const SESSIONS = [
    {
      id: 'sess-ms-vcat1-grp1',
      code: 'SESS-2026-MS-GRP1',
      title: 'Formation Analyse Vibratoire Niveau 1 — Groupe 1 (Terminée)',
      company: 'MAGHREB STEEL',
      theme: 'Analyse des vibrations niveau 1',
      course: 'vcat1',
      trainer: 'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
      site: 'MAGHREB STEEL — Site Tit Mellil & Salle Formation',
      start: '2026-09-14',
      end: '2026-10-02',
      days: 5,
      status: 'completed',
      isMulti: 1,
      parts: JSON.stringify([
        {
          partNumber: 1,
          title: 'Partie 1 (3 Jours — Septembre)',
          startDate: '2026-09-14',
          endDate: '2026-09-16',
          daysCount: 3,
          days: [
            { dayIndex: 1, date: '2026-09-14', displayDate: '14/09/2026', label: 'Jour 1 (14/09)' },
            { dayIndex: 2, date: '2026-09-15', displayDate: '15/09/2026', label: 'Jour 2 (15/09)' },
            { dayIndex: 3, date: '2026-09-16', displayDate: '16/09/2026', label: 'Jour 3 (16/09)' }
          ]
        },
        {
          partNumber: 2,
          title: 'Partie 2 (2 Jours — Octobre)',
          startDate: '2026-10-01',
          endDate: '2026-10-02',
          daysCount: 2,
          days: [
            { dayIndex: 4, date: '2026-10-01', displayDate: '01/10/2026', label: 'Jour 4 (01/10)' },
            { dayIndex: 5, date: '2026-10-02', displayDate: '02/10/2026', label: 'Jour 5 (02/10)' }
          ]
        }
      ]),
      desc: 'Session réelle terminée pour Maghreb Steel. Découpage en 2 parties : 14, 15, 16 septembre (Partie 1) puis reprise les 01 et 02 octobre (Partie 2). Feuilles d’émargement officielles Modèle 5 signées.'
    },
    {
      id: 'sess-ms-vcat1-grp2',
      code: 'SESS-2026-MS-GRP2',
      title: 'Formation Analyse Vibratoire Niveau 1 — Groupe 2',
      company: 'MAGHREB STEEL',
      theme: 'Analyse des vibrations niveau 1',
      course: 'vcat1',
      trainer: 'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
      site: 'MAGHREB STEEL — Usine Tit Mellil',
      start: '2026-10-12',
      end: '2026-10-27',
      days: 5,
      status: 'in_progress',
      isMulti: 1,
      parts: JSON.stringify([]),
      desc: 'Planning Maghreb Steel : Partie 1 (12 au 14 oct) et Partie 2 (26 au 27 oct).'
    },
    {
      id: 'sess-ms-vcat1-grp3',
      code: 'SESS-2026-MS-GRP3',
      title: 'Formation Analyse Vibratoire Niveau 1 — Groupe 3',
      company: 'MAGHREB STEEL',
      theme: 'Analyse des vibrations niveau 1',
      course: 'vcat1',
      trainer: 'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)',
      site: 'MAGHREB STEEL — Usine Tit Mellil',
      start: '2026-10-15',
      end: '2026-10-30',
      days: 5,
      status: 'planned',
      isMulti: 1,
      parts: JSON.stringify([]),
      desc: 'Session planifiée selon le calendrier officiel Maghreb Steel.'
    },
    {
      id: 'sess-ms-therm-grp1',
      code: 'SESS-2026-MS-THERM-G1',
      title: 'Formation Thermographie Infrarouge — Groupe 1',
      company: 'MAGHREB STEEL',
      theme: 'Thermographie',
      course: 'thermo1',
      trainer: 'M. Karim ELBAZ (OCP Maintenance Solutions)',
      site: 'MAGHREB STEEL — Salle Technique',
      start: '2026-10-19',
      end: '2026-10-23',
      days: 5,
      status: 'planned',
      isMulti: 0,
      parts: JSON.stringify([]),
      desc: 'Session continue Thermographie 19 au 23 Octobre 2026.'
    }
  ];

  for (const s of SESSIONS) {
    db.run(`
      INSERT OR REPLACE INTO training_sessions (id, session_code, title, course_id, company_name, action_theme, trainer_name, site_location, start_date, end_date, total_days, status, is_multi_part, parts_json, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      s.id, s.code, s.title, s.course, s.company, s.theme, s.trainer, s.site, s.start, s.end, s.days, s.status, s.isMulti, s.parts, s.desc, now
    ]);
  }
}

export function seedMaghrebSteelAttendanceAndTrainees(db: Database): void {
  const now = new Date().toISOString();
  const sessionId = 'sess-ms-vcat1-grp1';

  // Seed all 16 trainees in session_trainees
  for (const u of REAL_MAGHREB_STEEL_USERS_DATA) {
    const traineeId = `trainee-ms-g1-${u.idx}`;
    const userId = `usr-trainee-ms-1-${u.idx}`;

    const isFullAtt = ![8, 9, 12, 13, 16].includes(u.idx);
    const traineeNote = u.idx === 9
      ? 'Non émargé (Absence autorisée mission laboratoire - 0/10 créneaux)'
      : isFullAtt
      ? 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)'
      : 'Partiellement émargé (Présent Partie 1, non émargé Partie 2 - 6/10 créneaux)';

    db.run(`
      INSERT OR REPLACE INTO session_trainees (id, session_id, user_id, full_name, matricule, cin, cnss, csp, job_title, site_entity, email, phone, access_code, course_access_granted, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      traineeId,
      sessionId,
      userId,
      u.name,
      u.mat,
      u.cin || '',
      u.cnss || '',
      u.csp || 'E',
      '',
      'Maghreb Steel — Tit Mellil',
      u.email,
      `+212 661-12${String(u.idx).padStart(4, '0')}`,
      u.pass,
      1,
      traineeNote,
      now
    ]);

    // Seed all 10 attendance slots (5 days x 2 slots = 10 slots per trainee = 160 total slots)
    const daysData = [
      { dayIndex: 1, date: '2026-09-14' },
      { dayIndex: 2, date: '2026-09-15' },
      { dayIndex: 3, date: '2026-09-16' },
      { dayIndex: 4, date: '2026-10-01' },
      { dayIndex: 5, date: '2026-10-02' }
    ];

    daysData.forEach(day => {
      let status = 'present';
      let comment = 'Émargé sur feuille Modèle 5';
      let arrivalTimeMatin = '08:25';
      let arrivalTimeAprem = '13:28';

      // MARJAN SAADIA (idx 9): Absent justifié on all days (mission labo)
      if (u.idx === 9) {
        status = 'absent_justifie';
        comment = 'Absence autorisée — mission laboratoire';
        arrivalTimeMatin = '';
        arrivalTimeAprem = '';
      }
      // In Part 2 (Day 4 & 5): JAMEL (8), EL MANIAR (12), FAGOURI (13), ABDOU (16) absent part 2
      else if ((day.dayIndex === 4 || day.dayIndex === 5) && (u.idx === 8 || u.idx === 12 || u.idx === 13 || u.idx === 16)) {
        status = 'absent_justifie';
        comment = 'Non émargé en Partie 2 (retenu en production aciérie)';
        arrivalTimeMatin = '';
        arrivalTimeAprem = '';
      }

      // Matin
      db.run(`
        INSERT OR REPLACE INTO session_attendance (id, session_id, trainee_id, day_index, date, slot, status, arrival_time, comment, marked_by, marked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        `att-d${day.dayIndex}-m-${traineeId}`,
        sessionId,
        traineeId,
        day.dayIndex,
        day.date,
        'matin',
        status,
        arrivalTimeMatin,
        comment,
        'M. Mohammed KARMOUD',
        `${day.date}T08:35:00Z`
      ]);

      // Apres-midi
      db.run(`
        INSERT OR REPLACE INTO session_attendance (id, session_id, trainee_id, day_index, date, slot, status, arrival_time, comment, marked_by, marked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        `att-d${day.dayIndex}-a-${traineeId}`,
        sessionId,
        traineeId,
        day.dayIndex,
        day.date,
        'apres_midi',
        status,
        arrivalTimeAprem,
        comment,
        'M. Mohammed KARMOUD',
        `${day.date}T13:35:00Z`
      ]);
    });
  }
}

export function seedInitialCourseAndQuizStatus(db: Database): void {
  const now = new Date().toISOString();

  // Clean any legacy test users
  try {
    db.run("DELETE FROM users WHERE full_name LIKE '%TAHIRI%' OR full_name LIKE '%BOURAS%' OR full_name LIKE '%EL GHAZOUANI%';");
    db.run("DELETE FROM users WHERE email LIKE '%@ocpms.ma%' OR email LIKE '%@ocp-ms.com%' OR id = 'usr_student_1' OR id = 'usr_admin_1' OR id = 'usr_trainer_1';");
  } catch (e) {}

  // 1. CLEAR ALL QCM RESULTS & PROGRESS FOR MAGHREB STEEL TRAINEES
  // As requested: Maghreb Steel trainees have NOT passed the QCM!
  db.run("DELETE FROM user_quiz_results;");
  db.run("DELETE FROM user_progress;");

  // 2. Set user_course_status for all 16 trainees to 'non_commence' (0% progress, 0 score, no certification)
  for (const u of REAL_MAGHREB_STEEL_USERS_DATA) {
    const userId = `usr-trainee-ms-1-${u.idx}`;
    const username = u.email.split('@')[0];

    // Ensure trainee exists in users table with role 'eleve'
    db.run(`
      INSERT OR REPLACE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 'eleve', 1, ?);
    `, [
      userId,
      username,
      u.pass,
      u.name,
      u.email,
      now
    ]);

    // Set course status as not started (non_commence) with 0 quiz score
    db.run(`
      INSERT OR REPLACE INTO user_course_status (id, user_id, course_id, status, progress_percent, modules_completed, total_modules, average_quiz_score, certified, certified_at, last_activity_at)
      VALUES (?, ?, 'vibration_1', 'non_commence', 0, 0, 7, 0, 0, NULL, ?);
    `, [
      `status_${userId}_vibration_1`,
      userId,
      now
    ]);
  }
}

export async function ensureFullDatabaseIntegrity(db: Database): Promise<void> {
  const now = new Date().toISOString();

  // 1. Purge all invented OCP users and dummy student accounts
  try {
    db.run(`
      DELETE FROM users 
      WHERE email LIKE '%@ocpms.ma%' 
         OR email LIKE '%@ocp-ms.com%' 
         OR email LIKE '%ocpms@gmail.com%'
         OR username = 'eleve' 
         OR full_name LIKE '%Promotion 2026%' 
         OR full_name LIKE '%Étudiant Apprenant%'
         OR id = 'usr_student_1' 
         OR id = 'usr_admin_1' 
         OR id = 'usr_trainer_1';
    `);
  } catch (e) {}

  // 2. Ensure ONLY the 2 system users exist: Admin & Formateur
  db.run(`
    INSERT OR REPLACE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at)
    VALUES 
      ('usr_admin', 'admin', 'AdminVibLab2026!', 'M. Amine SALAMAT (Gestionnaire Formation)', 'amine.salamat@maghrebsteel.ma', 'admin', 1, ?),
      ('usr_trainer', 'mkarmoud', 'KarmoudVibe2026!', 'M. Mohammed KARMOUD (Formateur Expert VCAT-IV)', 'mohammed.karmoud@viblab.com', 'formateur', 1, ?);
  `, [now, now]);

  // 3. Training sessions
  const sRes = db.exec("SELECT COUNT(*) FROM training_sessions WHERE session_code LIKE '%MS%';");
  const sCount = sRes.length > 0 && sRes[0].values.length > 0 ? (sRes[0].values[0][0] as number) : 0;
  if (sCount === 0) {
    seedMaghrebSteelSessions(db);
  }

  // 4. Trainees in session_trainees (16 trainees)
  const trRes = db.exec("SELECT COUNT(*) FROM session_trainees WHERE session_id = 'sess-ms-vcat1-grp1';");
  const trCount = trRes.length > 0 && trRes[0].values.length > 0 ? (trRes[0].values[0][0] as number) : 0;
  if (trCount < 16) {
    seedMaghrebSteelAttendanceAndTrainees(db);
  }

  // 4b. Enforce exact Modèle 5 notes in session_trainees
  try {
    db.run(`
      UPDATE session_trainees 
      SET notes = 'Totalement émargé (Présent 5/5 jours - 10/10 créneaux signés)' 
      WHERE matricule NOT IN ('MS-108', 'MS-109', 'MS-112', 'MS-113', 'MS-116');

      UPDATE session_trainees 
      SET notes = 'Partiellement émargé (Présent Partie 1, non émargé Partie 2 - 6/10 créneaux)' 
      WHERE matricule IN ('MS-108', 'MS-112', 'MS-113', 'MS-116');

      UPDATE session_trainees 
      SET notes = 'Non émargé (Absence autorisée mission laboratoire - 0/10 créneaux)' 
      WHERE matricule = 'MS-109';
    `);
  } catch (e) {}

  // 5. Trainee attendance records in session_attendance (160 records)
  const attRes = db.exec("SELECT COUNT(*) FROM session_attendance WHERE session_id = 'sess-ms-vcat1-grp1';");
  const attCount = attRes.length > 0 && attRes[0].values.length > 0 ? (attRes[0].values[0][0] as number) : 0;
  if (attCount < 16) {
    seedMaghrebSteelAttendanceAndTrainees(db);
  }

  // 6. Ensure the 16 Maghreb Steel trainees exist in users table
  for (const u of REAL_MAGHREB_STEEL_USERS_DATA) {
    const userId = `usr-trainee-ms-1-${u.idx}`;
    const username = u.email.split('@')[0];
    db.run(`
      INSERT OR REPLACE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 'eleve', 1, ?);
    `, [userId, username, u.pass, u.name, u.email, now]);
  }

  // 7. CRITICAL REQUIREMENT: Purge fake QCM results! Maghreb Steel trainees have NOT passed the QCM!
  db.run("DELETE FROM user_quiz_results;");
  db.run("DELETE FROM user_progress;");
  db.run("UPDATE user_course_status SET status = 'non_commence', progress_percent = 0, modules_completed = 0, average_quiz_score = 0, certified = 0, certified_at = NULL;");

  // Persist immediately to IndexedDB
  await persistDb();
}


// ==========================================
// AUDIT LOGS
// ==========================================

export async function logAuditAction(
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string
): Promise<void> {
  try {
    const db = await getSqliteDb();
    const now = new Date().toISOString();
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
    stmt.run([id, userId, action, targetType, targetId, details, now]);
    stmt.free();
  } catch (err) {
    console.warn('Could not record audit log:', err);
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  const db = await getSqliteDb();
  const res = db.exec(`
    SELECT id, user_id, action, target_type, target_id, details, timestamp
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT ${limit};
  `);
  if (res.length === 0) return [];
  return res[0].values.map((r) => ({
    id: String(r[0]),
    userId: String(r[1] || 'SYSTEM'),
    action: String(r[2]),
    targetType: String(r[3] || ''),
    targetId: String(r[4] || ''),
    details: String(r[5] || ''),
    timestamp: String(r[6])
  }));
}

// ==========================================
// RAW SQL CONSOLE & DB EXPORT/IMPORT
// ==========================================

export async function executeSqlConsole(query: string): Promise<{
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}> {
  const startTime = performance.now();
  try {
    const db = await getSqliteDb();
    const trimmed = query.trim();
    if (!trimmed) {
      return { columns: [], values: [], rowCount: 0, executionTimeMs: 0 };
    }

    const res = db.exec(trimmed);
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    // If query mutated data, persist
    if (/^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i.test(trimmed)) {
      await persistDb();
    }

    if (res.length === 0) {
      return {
        columns: ['Status'],
        values: [['Requête exécutée avec succès (aucune ligne renvoyée)']],
        rowCount: 0,
        executionTimeMs
      };
    }

    return {
      columns: res[0].columns,
      values: res[0].values,
      rowCount: res[0].values.length,
      executionTimeMs
    };
  } catch (err: any) {
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      columns: ['Erreur'],
      values: [[err.message || String(err)]],
      rowCount: 0,
      executionTimeMs,
      error: err.message || String(err)
    };
  }
}

export async function exportSqliteBinary(): Promise<Blob> {
  const db = await getSqliteDb();
  const data = db.export();
  return new Blob([data], { type: 'application/x-sqlite3' });
}

export async function importSqliteBinary(fileData: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`
  });
  dbInstance = new SQL.Database(fileData);
  initSchema(dbInstance);
  await persistDb();
}

export async function resetDatabaseToFactory(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`
  });
  dbInstance = new SQL.Database();
  initSchema(dbInstance);
  await ensureFullDatabaseIntegrity(dbInstance);
}

export async function getDatabaseStats(): Promise<{
  userCount: number;
  moduleCount: number;
  courseCount: number;
  logCount: number;
  attendanceCount: number;
  traineeCount: number;
  sqliteVersion: string;
  approxSizeKb: number;
}> {
  const db = await getSqliteDb();
  const uRes = db.exec("SELECT COUNT(*) FROM users;");
  const mRes = db.exec("SELECT COUNT(*) FROM modules;");
  const cRes = db.exec("SELECT COUNT(*) FROM courses;");
  const lRes = db.exec("SELECT COUNT(*) FROM audit_logs;");
  const aRes = db.exec("SELECT COUNT(*) FROM session_attendance;");
  const tRes = db.exec("SELECT COUNT(*) FROM session_trainees;");
  const vRes = db.exec("SELECT sqlite_version();");

  const binary = db.export();
  const approxSizeKb = Math.round(binary.length / 1024);

  return {
    userCount: uRes.length > 0 && uRes[0].values.length > 0 ? (uRes[0].values[0][0] as number) : 0,
    moduleCount: mRes.length > 0 && mRes[0].values.length > 0 ? (mRes[0].values[0][0] as number) : 0,
    courseCount: cRes.length > 0 && cRes[0].values.length > 0 ? (cRes[0].values[0][0] as number) : 0,
    logCount: lRes.length > 0 && lRes[0].values.length > 0 ? (lRes[0].values[0][0] as number) : 0,
    attendanceCount: aRes.length > 0 && aRes[0].values.length > 0 ? (aRes[0].values[0][0] as number) : 0,
    traineeCount: tRes.length > 0 && tRes[0].values.length > 0 ? (tRes[0].values[0][0] as number) : 0,
    sqliteVersion: vRes.length > 0 && vRes[0].values.length > 0 ? String(vRes[0].values[0][0]) : '3.x',
    approxSizeKb
  };
}
