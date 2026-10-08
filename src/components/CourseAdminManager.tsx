import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  Save, 
  RotateCcw, 
  Eye, 
  FileCode, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Download,
  Shield,
  EyeOff,
  Tv,
  Key,
  Database,
  Users,
  Terminal,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  CheckCircle,
  X,
  ExternalLink,
  FileQuestion
} from 'lucide-react';
import { CourseData, CourseModule, SecuritySettings, User, UserRole } from '../types/course';
import { PREBUILT_HTML_MODULES, PrebuiltTemplate } from './courseTemplates';
import QuestionBankManager from './formation/QuestionBankManager';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getDatabaseStats, 
  executeSqlConsole, 
  exportSqliteBinary, 
  importSqliteBinary, 
  resetDatabaseToFactory,
  addModule as addModuleSqlite,
  updateModule as updateModuleSqlite,
  deleteModule as deleteModuleSqlite,
  reorderModules as reorderModulesSqlite,
  createCourse as createCourseSqlite,
  deleteCourse as deleteCourseSqlite
} from '../services/sqliteDatabase';
import UserAccountManager from './UserAccountManager';

interface CourseAdminManagerProps {
  courses: CourseData[];
  onUpdateCourses: (courses: CourseData[]) => void;
  securitySettings: SecuritySettings;
  onUpdateSecuritySettings: (settings: SecuritySettings) => void;
  onPreviewCourse: (course: CourseData, moduleIndex?: number) => void;
  theme: 'dark' | 'light' | 'mono';
  currentUser?: User | null;
  onSwitchToStudentView?: () => void;
}

export default function CourseAdminManager({
  courses,
  onUpdateCourses,
  securitySettings,
  onUpdateSecuritySettings,
  onPreviewCourse,
  theme,
  currentUser,
  onSwitchToStudentView
}: CourseAdminManagerProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Selection & Navigation Tabs
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || 'vibration_1');
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [isAddingNewModule, setIsAddingNewModule] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'questions' | 'users' | 'sqlite' | 'security' | 'course_meta'>('modules');
  const [editorPreviewMode, setEditorPreviewMode] = useState<'code' | 'preview' | 'split'>('split');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Module Draft Form
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [moduleSubtitle, setModuleSubtitle] = useState<string>('');
  const [modulePassword, setModulePassword] = useState<string>('');
  const [moduleHtmlPath, setModuleHtmlPath] = useState<string>('');
  const [moduleHtmlContent, setModuleHtmlContent] = useState<string>('');
  const [moduleTrainerNotes, setModuleTrainerNotes] = useState<string>('');
  const [moduleDuration, setModuleDuration] = useState<number>(45);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Users State (from SQLite)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New/Edit User Form State
  const [userFormUsername, setUserFormUsername] = useState<string>('');
  const [userFormFullName, setUserFormFullName] = useState<string>('');
  const [userFormEmail, setUserFormEmail] = useState<string>('');
  const [userFormPassword, setUserFormPassword] = useState<string>('');
  const [userFormRole, setUserFormRole] = useState<UserRole>('eleve');

  // SQLite Console & Stats State
  const [dbStats, setDbStats] = useState<{
    userCount: number;
    moduleCount: number;
    courseCount: number;
    logCount: number;
    attendanceCount?: number;
    traineeCount?: number;
    sqliteVersion: string;
    approxSizeKb: number;
  } | null>(null);
  const [selectedSqlTable, setSelectedSqlTable] = useState<string>('modules');
  const [sqlQueryInput, setSqlQueryInput] = useState<string>('SELECT id, title, html_path, access_code, updated_at, updated_by FROM modules ORDER BY order_index ASC;');
  const [sqlResult, setSqlResult] = useState<{
    columns: string[];
    values: any[][];
    rowCount: number;
    executionTimeMs: number;
    error?: string;
  } | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);

  // Selected course object
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Course Creation Modal State
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState<boolean>(false);
  const [courseFormTitle, setCourseFormTitle] = useState<string>('');
  const [courseFormSubtitle, setCourseFormSubtitle] = useState<string>('');
  const [courseFormDesc, setCourseFormDesc] = useState<string>('');
  const [courseFormLevel, setCourseFormLevel] = useState<string>('Niveau 2');
  const [courseFormCategory, setCourseFormCategory] = useState<string>('Analyse Vibratoire');

  const triggerToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormTitle.trim()) {
      triggerToast('⚠️ Le titre du cours est obligatoire.');
      return;
    }
    try {
      const newCourse = await createCourseSqlite({
        title: courseFormTitle.trim(),
        subtitle: courseFormSubtitle.trim(),
        desc: courseFormDesc.trim(),
        level: courseFormLevel,
        category: courseFormCategory
      });
      const updated = [...courses, newCourse];
      onUpdateCourses(updated);
      setSelectedCourseId(newCourse.id);
      setIsAddCourseModalOpen(false);
      setCourseFormTitle('');
      setCourseFormSubtitle('');
      setCourseFormDesc('');
      triggerToast(`🎉 Nouveau cours "${newCourse.title}" créé avec succès dans SQLite !`);
      refreshDbStats();
    } catch (err: any) {
      triggerToast(`❌ Erreur création cours: ${err.message}`);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (courseId === 'vibration_1') {
      triggerToast('⚠️ Le cours principal Niveau 1 ne peut pas être supprimé.');
      return;
    }
    const c = courses.find((x) => x.id === courseId);
    if (!confirm(`Supprimer définitivement le cours "${c?.title}" et tous ses modules associés de la base SQLite ?`)) return;

    try {
      await deleteCourseSqlite(courseId);
      const remaining = courses.filter((x) => x.id !== courseId);
      onUpdateCourses(remaining);
      setSelectedCourseId(remaining[0]?.id || 'vibration_1');
      triggerToast('🗑️ Cours et modules supprimés avec succès de la base SQLite.');
      refreshDbStats();
    } catch (err: any) {
      triggerToast(`❌ Erreur: ${err.message}`);
    }
  };

  // Load Users from SQLite
  const refreshUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const u = await getUsers();
      setUsersList(u);
    } catch (err) {
      console.warn('Error fetching users from SQLite:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load Database Stats
  const refreshDbStats = async () => {
    try {
      const s = await getDatabaseStats();
      setDbStats(s);
    } catch (err) {
      console.warn('Error fetching DB stats:', err);
    }
  };

  // Run initial data load
  useEffect(() => {
    refreshUsers();
    refreshDbStats();
  }, []);

  // Keep previewBlobUrl synchronized so scripts in standalone HTML execute in preview
  useEffect(() => {
    if (!moduleHtmlContent && (editingModule?.htmlUrl || moduleHtmlPath)) {
      setPreviewBlobUrl(editingModule?.htmlUrl || moduleHtmlPath);
      return;
    }
    if (!moduleHtmlContent) {
      setPreviewBlobUrl(null);
      return;
    }
    let raw = moduleHtmlContent;
    const isStandalone = /<!doctype|<html|<script|<head|<body/i.test(raw);
    let full = raw;
    if (!isStandalone) {
      full = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;color:#f8fafc;background:#0b1120;line-height:1.5;}table{width:100%;border-collapse:collapse;}svg{max-width:100%;}</style></head><body>${raw}</body></html>`;
    }
    const blob = new Blob([full], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setPreviewBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [moduleHtmlContent, editingModule?.htmlUrl, moduleHtmlPath]);

  // Open editor for a new module
  const handleStartAddModule = () => {
    setIsAddingNewModule(true);
    setEditingModule(null);
    setModuleTitle('Nouveau Module HTML');
    setModuleSubtitle('Description pédagogique du module');
    setModulePassword('OCPms2026@');
    setModuleHtmlPath(`/courses/niveau1/module_${currentCourse.modules.length + 1}.html`);
    setModuleHtmlContent(PREBUILT_HTML_MODULES[0]?.htmlContent || '<div class="p-6"><h3>Titre</h3><p>Contenu du cours</p></div>');
    setModuleTrainerNotes('Notes d\'accompagnement en salle.');
    setModuleDuration(45);
  };

  // Open editor for existing module
  const handleStartEditModule = (mod: CourseModule) => {
    setEditingModule(mod);
    setIsAddingNewModule(false);
    setModuleTitle(mod.title);
    setModuleSubtitle(mod.subtitle);
    setModulePassword(mod.password || mod.accessCode || '');
    setModuleHtmlPath(mod.htmlPath || mod.htmlUrl || '');
    setModuleHtmlContent(mod.htmlContent || '');
    setModuleTrainerNotes(mod.trainerNotes || '');
    setModuleDuration(mod.durationMin || 45);
    if ((mod.htmlUrl || mod.htmlPath) && !mod.htmlContent) {
      setPreviewBlobUrl(mod.htmlUrl || mod.htmlPath || null);
    }
  };

  // Save Module (Add or Edit) and sync to SQLite
  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) {
      triggerToast('⚠️ Veuillez renseigner le titre du module.');
      return;
    }

    const isStandalone = Boolean(editingModule?.isStandalone || /<!doctype|<html|<script|<head|<body/i.test(moduleHtmlContent));
    const nowIso = new Date().toISOString();
    const updatedBy = currentUser?.username || 'admin';

    const updatedModule: CourseModule = {
      id: editingModule ? editingModule.id : `mod_${Date.now()}`,
      courseId: currentCourse.id,
      title: moduleTitle,
      subtitle: moduleSubtitle,
      type: 'html',
      htmlContent: moduleHtmlContent || undefined,
      htmlUrl: moduleHtmlPath.trim() || editingModule?.htmlUrl,
      htmlPath: moduleHtmlPath.trim() || editingModule?.htmlPath,
      trainerNotes: moduleTrainerNotes,
      password: modulePassword.trim() || undefined,
      accessCode: modulePassword.trim() || undefined,
      isStandalone,
      durationMin: moduleDuration,
      createdAt: editingModule?.createdAt || nowIso,
      dateAdded: editingModule?.dateAdded || nowIso.split('T')[0],
      dateUpdated: nowIso,
      updatedAt: nowIso,
      updatedBy: updatedBy,
      author: updatedBy
    };

    // Update SQLite database
    try {
      if (editingModule) {
        await updateModuleSqlite(editingModule.id, {
          title: moduleTitle,
          subtitle: moduleSubtitle,
          htmlPath: moduleHtmlPath.trim(),
          htmlContent: moduleHtmlContent,
          durationMin: moduleDuration,
          accessCode: modulePassword.trim(),
          trainerNotes: moduleTrainerNotes,
          updatedBy: updatedBy
        });
      } else {
        await addModuleSqlite(currentCourse.id, {
          title: moduleTitle,
          subtitle: moduleSubtitle,
          htmlPath: moduleHtmlPath.trim(),
          htmlContent: moduleHtmlContent,
          durationMin: moduleDuration,
          accessCode: modulePassword.trim(),
          trainerNotes: moduleTrainerNotes,
          updatedBy: updatedBy
        });
      }
      refreshDbStats();
    } catch (err) {
      console.warn('Could not update SQLite module:', err);
    }

    // Update in-memory state
    const updatedCourses = courses.map((course) => {
      if (course.id === currentCourse.id) {
        let newModules: CourseModule[];
        if (editingModule) {
          newModules = course.modules.map((m) => (m.id === editingModule.id ? updatedModule : m));
        } else {
          newModules = [...course.modules, updatedModule];
        }
        return { ...course, modules: newModules };
      }
      return course;
    });

    onUpdateCourses(updatedCourses);
    setEditingModule(null);
    setIsAddingNewModule(false);
    triggerToast('✅ Module HTML et base SQLite enregistrés avec succès !');
  };

  // Delete Module
  const handleDeleteModule = async (moduleId: string) => {
    if (currentCourse.modules.length <= 1) {
      triggerToast('⚠️ Le cours doit contenir au moins un module.');
      return;
    }

    try {
      await deleteModuleSqlite(moduleId, currentUser?.username || 'admin');
      refreshDbStats();
    } catch (err) {
      console.warn('Could not delete module from SQLite:', err);
    }

    const updatedCourses = courses.map((course) => {
      if (course.id === currentCourse.id) {
        return {
          ...course,
          modules: course.modules.filter((m) => m.id !== moduleId)
        };
      }
      return course;
    });
    onUpdateCourses(updatedCourses);
    triggerToast('🗑️ Module supprimé de la base SQLite.');
  };

  // Duplicate Module
  const handleDuplicateModule = (mod: CourseModule) => {
    const nowIso = new Date().toISOString();
    const clone: CourseModule = {
      ...mod,
      id: `mod_${Date.now()}`,
      title: `${mod.title} (Copie)`,
      dateAdded: nowIso.split('T')[0],
      createdAt: nowIso,
      dateUpdated: nowIso,
      updatedAt: nowIso,
      updatedBy: currentUser?.username || 'admin'
    };
    const updatedCourses = courses.map((course) => {
      if (course.id === currentCourse.id) {
        return {
          ...course,
          modules: [...course.modules, clone]
        };
      }
      return course;
    });
    onUpdateCourses(updatedCourses);
    triggerToast('📋 Module dupliqué avec succès.');
  };

  // Move Module Up/Down
  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= currentCourse.modules.length) return;

    const newModules = [...currentCourse.modules];
    const [moved] = newModules.splice(index, 1);
    newModules.splice(newIdx, 0, moved);

    try {
      await reorderModulesSqlite(currentCourse.id, newModules.map((m) => m.id));
    } catch (err) {
      console.warn('Failed to reorder in SQLite:', err);
    }

    const updatedCourses = courses.map((course) => {
      if (course.id === currentCourse.id) {
        return { ...course, modules: newModules };
      }
      return course;
    });
    onUpdateCourses(updatedCourses);
  };

  // Insert a Prebuilt HTML Template
  const handleInsertTemplate = (template: PrebuiltTemplate) => {
    setModuleTitle(template.name);
    setModuleSubtitle(`Module pré-construit : ${template.category}`);
    setModuleHtmlContent(template.htmlContent);
    triggerToast(`✨ Modèle "${template.name}" chargé dans l'éditeur.`);
  };

  // Handle HTML File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setModuleHtmlContent(content);
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setModuleTitle(cleanName);
        setModuleHtmlPath(`/courses/niveau1/${file.name}`);
        const hasUnpacking = /unpacking|decrypt|password|crypto|cipher|aes/i.test(content);
        if (hasUnpacking) {
          setModuleSubtitle("Module HTML Standalone Sécurisé (Déverrouillage par mot de passe)");
          triggerToast(`📁 Fichier "${file.name}" importé (Protection par mot de passe détectée).`);
        } else {
          setModuleSubtitle("Module HTML Standalone");
          triggerToast(`📁 Fichier HTML "${file.name}" importé avec succès !`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ==========================================
  // USER MANAGEMENT HANDLERS (SQLITE)
  // ==========================================

  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setUserFormUsername('');
    setUserFormFullName('');
    setUserFormEmail('');
    setUserFormPassword('');
    setUserFormRole('eleve');
    setIsAddUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u: User) => {
    setEditingUser(u);
    setUserFormUsername(u.username);
    setUserFormFullName(u.fullName);
    setUserFormEmail(u.email);
    setUserFormPassword(''); // blank unless changing
    setUserFormRole(u.role);
    setIsAddUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormUsername.trim() || !userFormFullName.trim()) {
      triggerToast('⚠️ Identifiant et nom complet requis.');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName: userFormFullName.trim(),
          email: userFormEmail.trim(),
          role: userFormRole,
          password: userFormPassword.trim() || undefined
        });
        triggerToast(`✅ Utilisateur "${userFormUsername}" mis à jour.`);
      } else {
        if (!userFormPassword.trim()) {
          triggerToast('⚠️ Mot de passe requis pour la création.');
          return;
        }
        await createUser({
          username: userFormUsername.trim(),
          fullName: userFormFullName.trim(),
          email: userFormEmail.trim(),
          password: userFormPassword.trim(),
          role: userFormRole
        });
        triggerToast(`🎉 Nouvel utilisateur "${userFormUsername}" créé avec succès.`);
      }
      setIsAddUserModalOpen(false);
      await refreshUsers();
      await refreshDbStats();
    } catch (err: any) {
      triggerToast(`❌ Erreur: ${err.message || 'Impossible d\'enregistrer l\'utilisateur.'}`);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.username === 'admin') {
      triggerToast('⚠️ L\'administrateur principal ne peut pas être supprimé.');
      return;
    }
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${u.username}" ?`)) return;

    try {
      await deleteUser(u.id);
      triggerToast(`🗑️ Utilisateur "${u.username}" supprimé.`);
      await refreshUsers();
      await refreshDbStats();
    } catch (err: any) {
      triggerToast(`❌ Erreur: ${err.message}`);
    }
  };

  const handleToggleUserActive = async (u: User) => {
    if (u.username === 'admin') {
      triggerToast('⚠️ Impossible de désactiver le compte admin.');
      return;
    }
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      triggerToast(`Utilisateur ${u.isActive ? 'désactivé' : 'activé'}.`);
      await refreshUsers();
    } catch (err: any) {
      triggerToast(`❌ Erreur: ${err.message}`);
    }
  };

  // ==========================================
  // SQLITE CONSOLE & EXPLORER HANDLERS
  // ==========================================

  const handleExecuteSql = async () => {
    if (!sqlQueryInput.trim()) return;
    setIsExecutingSql(true);
    try {
      const res = await executeSqlConsole(sqlQueryInput);
      setSqlResult(res);
      await refreshDbStats();
    } catch (err: any) {
      setSqlResult({
        columns: ['Erreur'],
        values: [[err.message || String(err)]],
        rowCount: 0,
        executionTimeMs: 0,
        error: err.message
      });
    } finally {
      setIsExecutingSql(false);
    }
  };

  const handleSelectTableExplorer = (tableName: string) => {
    setSelectedSqlTable(tableName);
    const query = `SELECT * FROM ${tableName} LIMIT 50;`;
    setSqlQueryInput(query);
    executeSqlConsole(query).then(setSqlResult);
  };

  const handleExportDatabase = async () => {
    try {
      const blob = await exportSqliteBinary();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viblab_pro_${new Date().toISOString().split('T')[0]}.sqlite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('💾 Base SQLite exportée avec succès !');
    } catch (err) {
      triggerToast('❌ Erreur lors de l\'export de la base.');
    }
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (buffer) {
          await importSqliteBinary(new Uint8Array(buffer));
          await refreshUsers();
          await refreshDbStats();
          triggerToast('📂 Base SQLite importée et restaurée avec succès !');
        }
      } catch (err: any) {
        triggerToast(`❌ Erreur d'import: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleResetDatabase = async () => {
    if (!confirm('⚠️ Voulez-vous vraiment réinitialiser la base de données SQLite aux valeurs officielles d\'usine (3 utilisateurs et 7 modules) ?')) return;
    try {
      await resetDatabaseToFactory();
      await refreshUsers();
      await refreshDbStats();
      triggerToast('🔄 Base de données SQLite réinitialisée aux valeurs d\'usine.');
    } catch (err: any) {
      triggerToast(`❌ Erreur de réinitialisation: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMessage && (
        <div className="fixed top-16 right-8 z-50 px-4 py-2.5 bg-[#0F1B2D] border border-[#2A3B52] text-white text-[13px] font-medium rounded-lg shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E8A317]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* VibLab Screen 1d: Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-[#5B6675] tracking-wider uppercase">
            <span>Base SQLite active</span>
            <span className="text-[#B8B5AC]">·</span>
            <span>{dbStats?.userCount || 3} utilisateurs</span>
            <span className="text-[#B8B5AC]">·</span>
            <span>{dbStats?.moduleCount || 7} modules</span>
          </div>
          <h1 className="m-0 text-[28px] font-semibold leading-tight text-[#0F1B2D] tracking-tight">
            Administration
          </h1>
          <p className="m-0 text-[14px] text-[#5B6675] max-w-2xl">
            Administrez les comptes apprenants/formateurs, suivez le placement des fichiers HTML et leurs dates de mise à jour, et exécutez des requêtes directes sur la base SQLite intégrée.
          </p>
        </div>

        {/* Global Admin Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onSwitchToStudentView && (
            <button
              onClick={onSwitchToStudentView}
              className="flex items-center gap-2 h-[38px] px-3.5 border border-[#D6D3CA] bg-white rounded-md text-[13.5px] font-medium text-[#0F1B2D] hover:bg-[#F8F7F4] cursor-pointer shadow-2xs transition-colors"
            >
              <span>Aperçu vue élève</span>
            </button>
          )}

          <button
            onClick={() => onPreviewCourse(currentCourse)}
            className="flex items-center gap-2 h-[38px] px-3.5 border border-[#D6D3CA] bg-white rounded-md text-[13.5px] font-medium text-[#0F1B2D] hover:bg-[#F8F7F4] cursor-pointer shadow-2xs transition-colors"
          >
            <span>Tester dans le lecteur</span>
          </button>

          <button
            onClick={handleExportDatabase}
            className="flex items-center gap-2 h-[38px] px-4 bg-[#0F1B2D] hover:bg-[#1a2d47] rounded-md text-[13.5px] font-medium text-white cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter .sqlite</span>
          </button>
        </div>
      </div>

      {/* VibLab Screen 1d: Horizontal Underline Tabs */}
      <div className="flex items-center gap-7 border-b border-[#E3E1DA] text-[14px] font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('modules')}
          className={`py-2.5 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'border-b-2 border-[#0F1B2D] text-[#0F1B2D] font-semibold -mb-[1px]'
              : 'text-[#5B6675] hover:text-[#0F1B2D]'
          }`}
        >
          <span>Modules & fichiers HTML</span>
          <span className="font-mono text-xs text-[#5B6675]">{currentCourse.modules.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`py-2.5 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-b-2 border-[#0F1B2D] text-[#0F1B2D] font-semibold -mb-[1px]'
              : 'text-[#5B6675] hover:text-[#0F1B2D]'
          }`}
        >
          <span>Banque QCM & pièges</span>
          <span className="font-mono text-xs text-[#5B6675]">105</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            refreshUsers();
          }}
          className={`py-2.5 transition-all cursor-pointer bg-transparent border-0 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-b-2 border-[#0F1B2D] text-[#0F1B2D] font-semibold -mb-[1px]'
              : 'text-[#5B6675] hover:text-[#0F1B2D]'
          }`}
        >
          <span>Comptes & utilisateurs</span>
          <span className="font-mono text-xs text-[#5B6675]">{usersList.length}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sqlite');
            refreshDbStats();
            handleSelectTableExplorer('modules');
          }}
          className={`py-2.5 transition-all cursor-pointer bg-transparent border-0 ${
            activeTab === 'sqlite'
              ? 'border-b-2 border-[#0F1B2D] text-[#0F1B2D] font-semibold -mb-[1px]'
              : 'text-[#5B6675] hover:text-[#0F1B2D]'
          }`}
        >
          <span>Console SQL</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-2.5 transition-all cursor-pointer bg-transparent border-0 ${
            activeTab === 'security'
              ? 'border-b-2 border-[#0F1B2D] text-[#0F1B2D] font-semibold -mb-[1px]'
              : 'text-[#5B6675] hover:text-[#0F1B2D]'
          }`}
        >
          <span>Sécurité & filigrane</span>
        </button>
      </div>

      {/* TAB 1: MODULES LIST & HTML EDITOR                         */}
      {/* ========================================================= */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Modules List with Placed HTML and Dates (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Course Selector & Creation Bar */}
            <div className="p-4 bg-white border border-[#E3E1DA] rounded-xl shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-[#5B6675] uppercase">
                  Support de Formation / Cours
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="text-[13px] font-medium text-[#1F4E8C] hover:underline cursor-pointer bg-transparent border-0 p-0"
                  title="Créer un nouveau cours dans la base SQLite"
                >
                  + Nouveau cours
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setEditingModule(null);
                    setIsAddingNewModule(false);
                  }}
                  className="flex-1 h-[38px] px-3 border border-[#D6D3CA] rounded-md text-[13.5px] font-medium text-[#0F1B2D] bg-white outline-none cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      📚 {c.title} ({c.modules?.length || 0} modules)
                    </option>
                  ))}
                </select>

                {selectedCourseId !== 'vibration_1' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(selectedCourseId)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl border border-red-500/30 cursor-pointer"
                    title="Supprimer ce cours et ses modules de la base SQLite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#E3E1DA] rounded-xl shadow-2xs overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#EEECE6] bg-[#FAF9F6]">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-[#5B6675] uppercase">
                  Liste des modules · {currentCourse.modules.length}
                </span>
                <button
                  onClick={handleStartAddModule}
                  className="flex items-center gap-1 h-[30px] px-3 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white rounded-md text-[13px] font-medium cursor-pointer shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau module</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {currentCourse.modules.map((mod, idx) => {
                  const isSelected = editingModule?.id === mod.id;
                  return (
                    <div
                      key={mod.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isSelected
                          ? 'bg-[#FAF9F6] border-[#0F1B2D] shadow-xs'
                          : 'bg-white border-[#E3E1DA] hover:border-[#D6D3CA]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-md font-mono text-[11px] flex items-center justify-center font-bold shrink-0 mt-0.5 bg-[#F0EFEA] text-[#0F1B2D] border border-[#E3E1DA]">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-semibold text-[#0F1B2D] truncate">
                              {mod.title}
                            </h4>
                            {mod.subtitle && (
                              <p className="text-[11px] text-[#5B6675] truncate mt-0.5">
                                {mod.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Order Reorder arrows */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveModule(idx, 'up')}
                            disabled={idx === 0}
                            title="Monter"
                            className="p-1 text-[#8A929C] hover:text-[#0F1B2D] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveModule(idx, 'down')}
                            disabled={idx === currentCourse.modules.length - 1}
                            title="Descendre"
                            className="p-1 text-[#8A929C] hover:text-[#0F1B2D] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* HTML Path & Dates Info Badges */}
                      <div className="p-2.5 rounded-lg text-[11px] space-y-1 font-mono bg-[#FAF9F6] border border-[#E3E1DA] text-[#1C2733]">
                        <div className="flex items-center gap-1.5 text-[#0F1B2D] font-medium truncate">
                          <FileCode className="w-3.5 h-3.5 text-[#5B6675] shrink-0" />
                          <span className="truncate">{mod.htmlPath || mod.htmlUrl || 'Code HTML embarqué'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5B6675]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#8A929C]" />
                            <span>Mise à jour: {mod.dateUpdated ? new Date(mod.dateUpdated).toLocaleDateString('fr-FR') : 'Initiale'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Key className="w-3 h-3 text-[#9A5B00]" />
                            <span>{mod.password || mod.accessCode ? 'Protégé' : 'Libre'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#EEECE6] text-xs">
                        <button
                          onClick={() => onPreviewCourse(currentCourse, idx)}
                          className="text-[12px] font-medium text-[#1F4E8C] hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tester diapo</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicateModule(mod)}
                            title="Dupliquer"
                            className="text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer p-1.5 rounded hover:bg-[#F0EFEA]"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEditModule(mod)}
                            title="Modifier"
                            className="text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer p-1.5 rounded hover:bg-[#F0EFEA]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            title="Supprimer"
                            className="text-[#8A929C] hover:text-[#B42318] cursor-pointer p-1.5 rounded hover:bg-[#F0EFEA]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: HTML Module Editor & Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-[#E3E1DA] rounded-xl shadow-2xs overflow-hidden space-y-4 p-5">
              <div className="flex justify-between items-center border-b pb-3 border-[#E3E1DA]">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[11px] font-medium text-[#5B6675]">
                    {editingModule ? `MODULE ${String(currentCourse.modules.findIndex(m => m.id === editingModule.id) + 1).padStart(2, '0')} · ÉDITION` : 'NOUVEAU MODULE'}
                  </span>
                  <span className="text-base font-semibold text-[#0F1B2D]">
                    Éditeur & configuration HTML
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 h-[34px] px-3 border border-[#D6D3CA] bg-white hover:bg-[#FAF9F6] text-[#0F1B2D] rounded-md text-[13px] font-medium cursor-pointer shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer .html</span>
                    <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    onClick={handleSaveModule}
                    className="flex items-center gap-1.5 h-[34px] px-3.5 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white rounded-md text-[13px] font-medium cursor-pointer shadow-2xs transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>

              {/* Form Fields: Title, Subtitle, HTML Path, Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[12.5px] font-medium block mb-1 text-[#3A4552]">Titre du module :</label>
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13.5px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div>
                  <label className="text-[12.5px] font-medium block mb-1 text-[#3A4552]">Sous-titre / Objectif :</label>
                  <input
                    type="text"
                    value={moduleSubtitle}
                    onChange={(e) => setModuleSubtitle(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13.5px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div>
                  <label className="text-[12.5px] font-medium block mb-1 text-[#3A4552]">Chemin du fichier HTML placé :</label>
                  <input
                    type="text"
                    value={moduleHtmlPath}
                    onChange={(e) => setModuleHtmlPath(e.target.value)}
                    placeholder="ex: /courses/niveau1/module_1.html"
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13.5px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  />
                </div>

                <div>
                  <label className="text-[12.5px] font-medium block mb-1 text-[#3A4552]">Mot de passe de protection :</label>
                  <input
                    type="text"
                    value={modulePassword}
                    onChange={(e) => setModulePassword(e.target.value)}
                    placeholder="ex: OCPms2026@"
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13.5px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  />
                </div>
              </div>

              {/* Prebuilt Templates Quick Fill */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-medium text-[#5B6675] uppercase">Modèles pré-construits disponibles :</span>
                <div className="flex flex-wrap gap-2">
                  {PREBUILT_HTML_MODULES.slice(0, 4).map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleInsertTemplate(tpl)}
                      className="px-3 py-1 text-xs text-[#0F1B2D] bg-white rounded-full border border-[#D6D3CA] hover:bg-[#FAF9F6] cursor-pointer shadow-2xs transition-colors"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor and Live Preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[12.5px] font-medium text-[#3A4552]">Code HTML source ou embarqué :</span>
                  <div className="flex items-center gap-1 bg-[#F0EFEA] p-0.5 rounded-md border border-[#E3E1DA]">
                    <button
                      onClick={() => setEditorPreviewMode('code')}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                        editorPreviewMode === 'code' ? 'bg-[#0F1B2D] text-white shadow-2xs' : 'text-[#5B6675] hover:text-[#0F1B2D]'
                      }`}
                    >
                      Code
                    </button>
                    <button
                      onClick={() => setEditorPreviewMode('preview')}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                        editorPreviewMode === 'preview' ? 'bg-[#0F1B2D] text-white shadow-2xs' : 'text-[#5B6675] hover:text-[#0F1B2D]'
                      }`}
                    >
                      Aperçu
                    </button>
                    <button
                      onClick={() => setEditorPreviewMode('split')}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                        editorPreviewMode === 'split' ? 'bg-[#0F1B2D] text-white shadow-2xs' : 'text-[#5B6675] hover:text-[#0F1B2D]'
                      }`}
                    >
                      Scindé
                    </button>
                  </div>
                </div>

                <div className={`grid gap-3 min-h-[340px] ${
                  editorPreviewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                }`}>
                  {(editorPreviewMode === 'code' || editorPreviewMode === 'split') && (
                    <textarea
                      value={moduleHtmlContent}
                      onChange={(e) => setModuleHtmlContent(e.target.value)}
                      placeholder="Collez ici votre code HTML standalone ou laissez vide si le module pointe vers un chemin fichier..."
                      className="w-full h-80 p-3.5 rounded-lg border border-[#D6D3CA] bg-[#FAF9F6] text-[#0F1B2D] font-mono text-xs outline-none resize-none leading-relaxed focus:border-[#0F1B2D] focus:bg-white transition-colors"
                    />
                  )}

                  {(editorPreviewMode === 'preview' || editorPreviewMode === 'split') && (
                    <div className="h-80 rounded-lg border border-[#D6D3CA] overflow-hidden bg-white shadow-2xs flex flex-col">
                      {previewBlobUrl ? (
                        <iframe
                          src={previewBlobUrl}
                          className="w-full flex-1 border-0"
                          title="Module Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-[#8A929C] text-xs text-center font-medium">
                          Renseignez le code HTML ou le chemin du fichier pour afficher l'aperçu dynamique.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USERS & ROLES MANAGEMENT (SQLITE)                  */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <UserAccountManager theme={theme} />
      )}

      {/* ========================================================= */}
      {/* TAB 3: SQLITE CONSOLE & DATABASE EXPLORER                 */}
      {/* ========================================================= */}
      {activeTab === 'sqlite' && (
        <div className="space-y-6">
          {/* SQLite Stats Cards (6 strip cards) */}
          <div className="grid grid-cols-2 md:grid-cols-6 bg-white border border-[#E3E1DA] rounded-xl overflow-hidden shadow-2xs divide-y md:divide-y-0 md:divide-x divide-[#EEECE6]">
            <div className="p-4 flex flex-col gap-1">
              <span className="text-xs text-[#5B6675]">Moteur SQLite</span>
              <span className="text-[18px] font-semibold text-[#0F1B2D] font-mono">
                {dbStats?.sqliteVersion || '3.x'} WASM
              </span>
              <span className="text-[11px] text-[#5B6675]">WebAssembly natif</span>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-xs text-[#5B6675]">Total utilisateurs</span>
              <span className="text-[18px] font-semibold text-[#0F1B2D]">
                {dbStats?.userCount || 19}{' '}
                <span className="text-[11px] font-normal text-[#5B6675]">comptes</span>
              </span>
              <span className="text-[11px] text-[#5B6675] font-mono">Table 'users'</span>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-xs text-[#5B6675]">Émargements Modèle 5</span>
              <span className="text-[18px] font-semibold text-[#1E7A4F]">
                {dbStats?.attendanceCount || 160}{' '}
                <span className="text-[11px] font-normal text-[#5B6675]">pointages</span>
              </span>
              <span className="text-[11px] text-[#1E7A4F] font-mono">session_attendance</span>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-xs text-[#5B6675]">Stagiaires Maghreb Steel</span>
              <span className="text-[18px] font-semibold text-[#1F4E8C]">
                {dbStats?.traineeCount || 16}{' '}
                <span className="text-[11px] font-normal text-[#5B6675]">inscrits</span>
              </span>
              <span className="text-[11px] text-[#1F4E8C] font-mono">session_trainees</span>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-xs text-[#5B6675]">Modules cours</span>
              <span className="text-[18px] font-semibold text-[#0F1B2D]">
                {dbStats?.moduleCount || 7}{' '}
                <span className="text-[11px] font-normal text-[#5B6675]">modules</span>
              </span>
              <span className="text-[11px] text-[#5B6675] font-mono">Table 'modules'</span>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-xs text-[#5B6675]">Taille base</span>
              <span className="text-[18px] font-semibold text-[#0F1B2D]">
                {dbStats?.approxSizeKb || 270}{' '}
                <span className="text-[11px] font-normal text-[#5B6675]">Ko</span>
              </span>
              <span className="text-[11px] text-[#5B6675]">IndexedDB active</span>
            </div>
          </div>

          {/* Database Backup & Restore Controls */}
          <div className="p-4 bg-white border border-[#E3E1DA] rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#F0EFEA] border border-[#E3E1DA] flex items-center justify-center text-[#0F1B2D]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-[#0F1B2D]">Sauvegarde & Restauration SQLite</div>
                <div className="text-xs text-[#5B6675]">Exportez le fichier binaire .sqlite ou importez une base existante.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDatabase}
                className="h-[34px] px-3.5 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white text-[13px] font-medium rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger (.sqlite)</span>
              </button>

              <label className="h-[34px] px-3.5 bg-white border border-[#D6D3CA] hover:bg-[#FAF9F6] text-[#0F1B2D] text-[13px] font-medium rounded-md cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Importer (.sqlite)</span>
                <input type="file" accept=".sqlite,.db" onChange={handleImportDatabase} className="hidden" />
              </label>

              <button
                onClick={handleResetDatabase}
                className="h-[34px] px-3 bg-white border border-[#D6D3CA] text-[#8A929C] hover:text-[#B42318] hover:border-[#B42318]/40 text-[13px] font-medium rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser usine</span>
              </button>
            </div>
          </div>

          {/* Table Explorer Tabs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-medium text-[#5B6675] uppercase">Explorer la table SQLite :</span>
              {([
                'user_course_status',
                'user_quiz_results',
                'session_attendance',
                'session_trainees',
                'users',
                'training_sessions',
                'user_progress',
                'modules',
                'courses',
                'audit_logs'
              ] as const).map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => handleSelectTableExplorer(tbl)}
                  className={`h-[30px] px-3 text-xs font-mono font-medium rounded-md border transition-all cursor-pointer ${
                    selectedSqlTable === tbl
                      ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-2xs font-semibold'
                      : 'bg-white border-[#D6D3CA] text-[#5B6675] hover:text-[#0F1B2D] hover:bg-[#FAF9F6]'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>

            {/* Quick Diagnostic Queries */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-[11px] font-mono text-[#8A929C] uppercase font-semibold">Requêtes rapides :</span>
              <button
                onClick={() => {
                  const q = `SELECT u.full_name, u.role, c.status, c.progress_percent, c.modules_completed, c.average_quiz_score, c.certified, c.certified_at FROM users u LEFT JOIN user_course_status c ON u.id = c.user_id ORDER BY c.progress_percent DESC;`;
                  setSqlQueryInput(q);
                  executeSqlConsole(q).then(setSqlResult);
                }}
                className="px-2.5 py-1 rounded bg-[#F0F4F9] text-[#1F4E8C] border border-[#D0DFEF] text-[11px] hover:bg-[#E2EDF8] cursor-pointer"
              >
                📊 Validation & Certification Cours
              </button>
              <button
                onClick={() => {
                  const q = `SELECT a.date AS "Date", a.slot AS "Créneau", a.status AS "Statut", t.full_name AS "Apprenant", t.matricule AS "Matricule", a.comment AS "Motif Absence" FROM session_attendance a JOIN session_trainees t ON a.trainee_id = t.id WHERE a.status != 'present' ORDER BY a.date ASC, t.full_name ASC;`;
                  setSqlQueryInput(q);
                  executeSqlConsole(q).then(setSqlResult);
                }}
                className="px-2.5 py-1 rounded bg-[#FEF6E0] text-[#9A6700] border border-[#FDE68A] text-[11px] hover:bg-[#FDF6E2] cursor-pointer font-medium"
              >
                ⚠️ Non Émargés & Absences Partielles
              </button>
              <button
                onClick={() => {
                  const q = `SELECT t.full_name AS "Nom Apprenant", t.matricule AS "Matricule", COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS "Presences (sur 10)", COUNT(CASE WHEN a.status != 'present' THEN 1 END) AS "Absences", ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1.0 END) / COUNT(*) * 100, 1) || '%' AS "Taux Assiduite", CASE WHEN COUNT(CASE WHEN a.status = 'present' THEN 1 END) = 10 THEN 'Totalement emarge (10/10)' WHEN COUNT(CASE WHEN a.status = 'present' THEN 1 END) = 6 THEN 'Partiellement emarge (6/10 - Absent Partie 2)' WHEN COUNT(CASE WHEN a.status = 'present' THEN 1 END) = 0 THEN 'Non emarge (0/10 - Mission labo)' ELSE 'Incomplet' END AS "Statut Emargement Modele 5" FROM session_trainees t JOIN session_attendance a ON a.trainee_id = t.id GROUP BY t.id ORDER BY "Presences (sur 10)" ASC, t.matricule ASC;`;
                  setSqlQueryInput(q);
                  executeSqlConsole(q).then(setSqlResult);
                }}
                className="px-2.5 py-1 rounded bg-[#F0F4F9] text-[#1F4E8C] border border-[#D0DFEF] text-[11px] hover:bg-[#E2EDF8] cursor-pointer font-medium"
              >
                📊 Bilan Émargement (Totalement vs Partiellement Émargé)
              </button>
              <button
                onClick={() => {
                  const q = `SELECT matricule AS "Matricule", full_name AS "Nom Apprenant", notes AS "État Émargement (colonne notes)" FROM session_trainees ORDER BY matricule ASC;`;
                  setSqlQueryInput(q);
                  executeSqlConsole(q).then(setSqlResult);
                }}
                className="px-2.5 py-1 rounded bg-[#FAF9F5] text-[#0F1B2D] border border-[#D6D3CA] text-[11px] hover:bg-[#F2EFE8] cursor-pointer font-medium"
              >
                📑 Colonne 'notes' (session_trainees)
              </button>
              <button
                onClick={() => {
                  const q = `SELECT a.date, a.slot, a.status, t.full_name, t.matricule, a.marked_by FROM session_attendance a JOIN session_trainees t ON a.trainee_id = t.id ORDER BY a.date DESC LIMIT 50;`;
                  setSqlQueryInput(q);
                  executeSqlConsole(q).then(setSqlResult);
                }}
                className="px-2.5 py-1 rounded bg-[#EBF7EE] text-[#1E7A4F] border border-[#C3E6CB] text-[11px] hover:bg-[#DBF1DF] cursor-pointer"
              >
                📋 Tous les Émargements (Modèle 5)
              </button>
            </div>

            {/* SQL Query Console */}
            <div className="p-5 bg-white border border-[#E3E1DA] rounded-xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-mono font-medium text-[#0F1B2D]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Console SQL Interactive :</span>
                </div>
                {sqlResult && (
                  <span className="text-[11px] font-mono text-[#5B6675]">
                    {sqlResult.rowCount} résultat(s) en {sqlResult.executionTimeMs} ms
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={sqlQueryInput}
                  onChange={(e) => setSqlQueryInput(e.target.value)}
                  rows={3}
                  className="w-full p-3 font-mono text-xs rounded-md border border-[#D6D3CA] bg-[#FAF9F6] text-[#0F1B2D] outline-none focus:border-[#0F1B2D] focus:bg-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] text-[#5B6675] font-mono">
                  Syntaxe standard SQLite supportée (SELECT, INSERT, UPDATE, DELETE, PRAGMA)
                </div>

                <button
                  onClick={handleExecuteSql}
                  disabled={isExecutingSql}
                  className="h-[36px] px-4 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white text-[13px] font-medium rounded-md flex items-center gap-2 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E8A317]" />
                  <span>Exécuter la requête</span>
                </button>
              </div>

              {/* SQL Result Table */}
              {sqlResult && (
                <div className="mt-4 border border-[#E3E1DA] rounded-lg overflow-hidden bg-white">
                  {sqlResult.error ? (
                    <div className="p-3 bg-[#FEF3F2] border-l-2 border-[#B42318] text-[#B42318] text-xs font-mono font-medium">
                      Erreur SQL : {sqlResult.error}
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[400px]">
                      <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead>
                          <tr className="border-b border-[#E3E1DA] bg-[#FAF9F6] text-[10px] uppercase font-semibold text-[#5B6675]">
                            {sqlResult.columns.map((col, idx) => (
                              <th key={idx} className="p-2.5 whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEECE6]">
                          {sqlResult.values.length === 0 ? (
                            <tr>
                              <td colSpan={sqlResult.columns.length} className="p-4 text-center text-[#8A929C]">
                                Aucun résultat retourné.
                              </td>
                            </tr>
                          ) : (
                            sqlResult.values.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#FAF9F6] text-[#1C2733]">
                                {row.map((val, cIdx) => (
                                  <td key={cIdx} className="p-2.5 max-w-xs truncate" title={String(val)}>
                                    {val === null ? <span className="opacity-40 italic">null</span> : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: BANQUE QCM & GESTIONNAIRE DE PIÈGES                  */}
      {/* ========================================================= */}
      {activeTab === 'questions' && (
        <div className="w-full animate-fade-in">
          <QuestionBankManager
            theme={theme}
            currentUserRole={currentUser?.role || 'admin'}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SECURITY SETTINGS                                  */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-xl border border-[#E3E1DA] bg-white shadow-2xs max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-semibold text-[#0F1B2D]">
              Protection Anti-Fuite & Sécurité des Cours
            </h3>
            <p className="text-xs text-[#5B6675] mt-0.5">
              Ces paramètres sont appliqués directement lors de la lecture des modules dans le lecteur interactif.
            </p>
          </div>

          <div className="space-y-3">
            {/* Solution 1: Native Windows Hardware DRM / Anti-OBS Launcher Card */}
            <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/60 flex items-start justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[13.5px] font-bold text-[#0F1B2D]">
                    Solution 1 : Blindage Matériel Windows Actif (WDA_EXCLUDEFROMCAPTURE)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                    100% Anti-OBS
                  </span>
                </div>
                <p className="text-[12px] text-[#475569] leading-relaxed">
                  Pour rendre VibLab <strong>100% noir dans OBS Studio</strong>, Windows Snipping Tool (<code className="font-mono bg-white/80 px-1 py-0.5 rounded">Win+Shift+S</code>), Windows Game Bar et partages Discord/Zoom tout en conservant une visualisation normale sur votre écran physique : lancez l'application via le fichier <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded font-bold text-[#0F1B2D] border border-blue-200">LANCER-VIBLAB-SECURISE.bat</code> à la racine du projet.
                </p>
              </div>
            </div>

            {/* Anti Inspection */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-[#E3E1DA] bg-white hover:bg-[#FAF9F6] cursor-pointer transition-colors">
              <div>
                <div className="text-[13px] font-medium text-[#0F1B2D]">Anti-Inspection Développeur (F12 / Ctrl+Shift+I)</div>
                <div className="text-[11px] text-[#5B6675]">Bloque l'ouverture de l'inspecteur web et le clic droit.</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.antiInspection}
                onChange={(e) => onUpdateSecuritySettings({ ...securitySettings, antiInspection: e.target.checked })}
                className="w-4 h-4 accent-[#0F1B2D]"
              />
            </label>

            {/* Anti Screen Blur & Win+Shift+S Snipping Tool */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-[#E3E1DA] bg-white hover:bg-[#FAF9F6] cursor-pointer transition-colors">
              <div>
                <div className="text-[13px] font-medium text-[#0F1B2D]">Bouclier Anti-Capture (Win+Shift+S & PrintScreen)</div>
                <div className="text-[11px] text-[#5B6675]">Écran noir immédiat (0ms) en cas de Win+Shift+S, PrintScreen, ou perte de focus fenêtre.</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.antiScreenBlur}
                onChange={(e) => onUpdateSecuritySettings({ ...securitySettings, antiScreenBlur: e.target.checked, antiSnippingTool: e.target.checked })}
                className="w-4 h-4 accent-[#0F1B2D]"
              />
            </label>

            {/* Anti Screen Recording & Third Party Software */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-[#E3E1DA] bg-white hover:bg-[#FAF9F6] cursor-pointer transition-colors">
              <div>
                <div className="text-[13px] font-medium text-[#0F1B2D]">Blocage Enregistreurs Vidéo Tiers (OBS, Game Bar Win+Alt+R, Loom)</div>
                <div className="text-[11px] text-[#5B6675]">Intercepte l'API DisplayMedia, bloque les raccourcis d'enregistrement vidéo et masque les écrans en cas de bascule externe.</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.antiScreenRecording !== false}
                onChange={(e) => onUpdateSecuritySettings({ ...securitySettings, antiScreenRecording: e.target.checked })}
                className="w-4 h-4 accent-[#0F1B2D]"
              />
            </label>

            {/* Anti Print */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-[#E3E1DA] bg-white hover:bg-[#FAF9F6] cursor-pointer transition-colors">
              <div>
                <div className="text-[13px] font-medium text-[#0F1B2D]">Anti-Impression (Ctrl+P)</div>
                <div className="text-[11px] text-[#5B6675]">Masque le cours et vide la feuille en cas de tentative d'impression.</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.antiPrint}
                onChange={(e) => onUpdateSecuritySettings({ ...securitySettings, antiPrint: e.target.checked })}
                className="w-4 h-4 accent-[#0F1B2D]"
              />
            </label>

            {/* Watermark Enabled */}
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-[#E3E1DA] bg-white hover:bg-[#FAF9F6] cursor-pointer transition-colors">
              <div>
                <div className="text-[13px] font-medium text-[#0F1B2D]">Filigrane Légal Judiciaire (Watermark)</div>
                <div className="text-[11px] text-[#5B6675]">Affiche l'identifiant et l'horodatage en diagonale translucide sur les diapositives.</div>
              </div>
              <input
                type="checkbox"
                checked={securitySettings.watermarkEnabled}
                onChange={(e) => onUpdateSecuritySettings({ ...securitySettings, watermarkEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#0F1B2D]"
              />
            </label>

            {/* Watermark Text Input */}
            <div className="pt-2">
              <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Identifiant inscrit sur le filigrane :</label>
              <input
                type="text"
                value={securitySettings.watermarkUser}
                onChange={(e) => onUpdateSecuritySettings({ ...securitySettings, watermarkUser: e.target.value })}
                className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT USER MODAL (SQLITE)                            */}
      {/* ========================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1B2D]/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#E3E1DA] bg-white text-[#1C2733] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#EEECE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F1B2D]" />
                <h3 className="text-[15px] font-semibold text-[#0F1B2D]">
                  {editingUser ? `Modifier @${editingUser.username}` : 'Ajouter un utilisateur SQLite'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Nom complet :</label>
                <input
                  type="text"
                  value={userFormFullName}
                  onChange={(e) => setUserFormFullName(e.target.value)}
                  placeholder="ex: Mohammed Karmoud"
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Identifiant (username) :</label>
                <input
                  type="text"
                  value={userFormUsername}
                  onChange={(e) => setUserFormUsername(e.target.value)}
                  disabled={Boolean(editingUser)}
                  placeholder="ex: mkarmoud"
                  className={`w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D] ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Email :</label>
                <input
                  type="email"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  placeholder="ex: user@ocpms.ma"
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer) :' : 'Mot de passe initial :'}
                </label>
                <input
                  type="password"
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Mot de passe sécurisé'}
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Rôle d'accès :</label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as UserRole)}
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-medium text-[#0F1B2D] outline-none cursor-pointer"
                >
                  <option value="eleve">🎓 Élève (Accès au parcours certifiant & QCM)</option>
                  <option value="formateur">👨‍🏫 Formateur (Accès lecteur + notes formateur + aperçu)</option>
                  <option value="admin">🛡️ Administrateur (Accès complet + gestion modules & SQLite)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="h-[36px] px-3.5 text-[13px] font-medium text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-4 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white text-[13px] font-medium rounded-md cursor-pointer shadow-2xs transition-colors"
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: ADD NEW COURSE (SQLITE) */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1B2D]/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-[#E3E1DA] bg-white text-[#1C2733] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEECE6]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0F1B2D]" />
                <span className="text-[15px] font-semibold text-[#0F1B2D]">Créer un nouveau cours (Support de formation)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                className="p-1 rounded text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B6675] m-0">
              Renseignez les métadonnées du cours. Il sera immédiatement inséré dans la table SQLite <code className="font-mono text-[#0F1B2D] font-semibold">courses</code> et vous pourrez y associer ses modules HTML.
            </p>

            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                  Titre du cours * :
                </label>
                <input
                  type="text"
                  value={courseFormTitle}
                  onChange={(e) => setCourseFormTitle(e.target.value)}
                  placeholder="ex: Vibrations Niveau 2 — Diagnostic Avancé ISO 18436-2"
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                  Sous-titre / Référence :
                </label>
                <input
                  type="text"
                  value={courseFormSubtitle}
                  onChange={(e) => setCourseFormSubtitle(e.target.value)}
                  placeholder="ex: Support officiel OCP Maintenance Solutions VCAT-II"
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                    Niveau :
                  </label>
                  <select
                    value={courseFormLevel}
                    onChange={(e) => setCourseFormLevel(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-medium text-[#0F1B2D] outline-none cursor-pointer"
                  >
                    <option value="Niveau 1">Niveau 1 (VCAT-I)</option>
                    <option value="Niveau 2">Niveau 2 (VCAT-II)</option>
                    <option value="Niveau 3">Niveau 3 (VCAT-III)</option>
                    <option value="Expert">Expertise & Diagnostic Spécialisé</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                    Catégorie :
                  </label>
                  <select
                    value={courseFormCategory}
                    onChange={(e) => setCourseFormCategory(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-medium text-[#0F1B2D] outline-none cursor-pointer"
                  >
                    <option value="Analyse Vibratoire">Analyse Vibratoire</option>
                    <option value="Équilibrage Dynamique">Équilibrage Dynamique</option>
                    <option value="Alignement Laser">Alignement Laser</option>
                    <option value="Tribologie & Lubrification">Tribologie & Lubrification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                  Description pédagogique :
                </label>
                <textarea
                  rows={2}
                  value={courseFormDesc}
                  onChange={(e) => setCourseFormDesc(e.target.value)}
                  placeholder="Objectifs, prérequis et compétences visées par ce cours..."
                  className="w-full p-2.5 rounded-md border border-[#D6D3CA] bg-white text-[13px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D] leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="h-[36px] px-3.5 text-[13px] font-medium text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-4 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white text-[13px] font-medium rounded-md shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer le cours dans SQLite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
