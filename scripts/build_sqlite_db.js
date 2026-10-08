import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const dbDir = path.join(projectRoot, 'database');
const migrationsDir = path.join(dbDir, 'migrations');
const dbFilePath = path.join(dbDir, 'viblab.sqlite');

async function buildDatabase() {
  console.log('🚀 Initialisation du moteur SQLite via WebAssembly (sql.js)...');
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 1. Lire et appliquer les migrations
  const migrationFiles = [
    '001_initial_schema.sql',
    '002_seed_real_data.sql'
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier de migration manquant : ${filePath}`);
    }
    console.log(`📦 Application de la migration : ${file}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    db.run(sqlContent);
  }

  // 2. Vérification et statistiques
  console.log('\n📊 Statistiques de la base de données SQLite :');
  const tables = [
    'users',
    'courses',
    'modules',
    'training_sessions',
    'session_trainees',
    'session_attendance',
    'audit_logs',
    'schema_migrations'
  ];

  for (const t of tables) {
    const res = db.exec(`SELECT COUNT(*) FROM ${t};`);
    const count = res[0]?.values[0][0] ?? 0;
    console.log(`   - ${t.padEnd(20)} : ${count} enregistrements`);
  }

  // 3. Exporter et écrire le fichier binaire physique
  console.log(`\n💾 Écriture du fichier SQLite physique sur disque :`);
  console.log(`   Chemin : ${dbFilePath}`);
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFilePath, buffer);

  const stats = fs.statSync(dbFilePath);
  console.log(`✅ Base de données générée avec succès ! Taille : ${(stats.size / 1024).toFixed(2)} Ko`);
  
  db.close();
}

buildDatabase().catch(err => {
  console.error('❌ Erreur lors de la génération de la base de données :', err);
  process.exit(1);
});
