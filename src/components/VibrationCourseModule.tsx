import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Tv, 
  GraduationCap, 
  Users, 
  Award, 
  Sparkles, 
  Clock, 
  Target, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sliders,
  Layers,
  Settings,
  Eye,
  Plus,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Trophy,
  X
} from 'lucide-react';
import { CourseData, SecuritySettings, User } from '../types/course';
import { INITIAL_COURSES } from '../utils/defaultCourses';
import { getCurrentUser, getActiveViewMode, setActiveViewMode, logout, subscribeAuth, ViewMode } from '../services/authService';
import { getCourseData, getAllCourses } from '../services/sqliteDatabase';
import SecureCourseViewer from './SecureCourseViewer';
import CourseAdminManager from './CourseAdminManager';
import StudentCourseView from './StudentCourseView';
import TrainerCourseView from './TrainerCourseView';
import AdminLoginModal from './AdminLoginModal';
import FormationQcmModule from './FormationQcmModule';
import { PASS } from './formation/formationData';

interface VibrationCourseModuleProps {
  theme: 'dark' | 'light' | 'mono';
  isFullScreenMode?: boolean;
  onToggleFullScreenMode?: () => void;
  onOpenSimulatorTab?: (tabId: string) => void;
}

const STORAGE_KEY_COURSES = 'viblab_courses_v4';
const STORAGE_KEY_SECURITY = 'viblab_security_settings';

export default function VibrationCourseModule({ 
  theme,
  isFullScreenMode = false,
  onToggleFullScreenMode,
  onOpenSimulatorTab
}: VibrationCourseModuleProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  // Auth & View Mode State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [viewMode, setViewMode] = useState<ViewMode>(() => getActiveViewMode());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Courses state
  const [courses, setCourses] = useState<CourseData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOfficialNiveau1 = 
            parsed.length === 1 && 
            parsed[0].id === 'vibration_1' && 
            parsed[0].modules?.length === 7 && 
            Boolean(parsed[0].modules[0]?.htmlUrl || parsed[0].modules[0]?.htmlPath);
          if (isOfficialNiveau1) return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read saved courses from localStorage, using defaults.');
    }
    return INITIAL_COURSES;
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECURITY);
      if (saved) return JSON.parse(saved);
    } catch (err) {}
    return {
      antiInspection: true,
      antiScreenBlur: true,
      antiPrint: true,
      watermarkEnabled: true,
      watermarkUser: 'mohammedkarmoud.ocpms@gmail.com',
      watermarkOpacity: 0.05
    };
  });

  // Active navigation space in student view ('slides' | 'exercises')
  const [activeTab, setActiveTab] = useState<'slides' | 'exercises'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('kahoot_pin')) {
      return 'exercises';
    }
    return 'slides';
  });

  // Active selected course
  const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id || 'vibration_1');
  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0] || INITIAL_COURSES[0];

  // Viewer state
  const [isViewerActive, setIsViewerActive] = useState<boolean>(false);
  const [viewerInitialModuleIndex, setViewerInitialModuleIndex] = useState<number>(0);

  // Trainer notes toggle
  const [isTrainerMode, setIsTrainerMode] = useState<boolean>(true);

  // Exercise States (Niveau 1 & Niveau 2)
  const [userAnswersL1, setUserAnswersL1] = useState<string[]>(['', '', '']);
  const [gradedL1, setGradedL1] = useState<boolean[]>([false, false, false]);
  const [scoreL1, setScoreL1] = useState<number | null>(null);

  const [userAnswersL2, setUserAnswersL2] = useState<string[]>(['', '', '']);
  const [gradedL2, setGradedL2] = useState<boolean[]>([false, false, false]);
  const [scoreL2, setScoreL2] = useState<number | null>(null);

  const [showExerciseAnswers, setShowExerciseAnswers] = useState<boolean>(false);

  // Custom VibLab modal for locked course modules
  const [lockedModuleModal, setLockedModuleModal] = useState<{
    targetModuleIndex: number;
    requiredModuleIndex: number;
    title: string;
    bestScore: number;
  } | null>(null);

  // Subscribe to Auth changes
  useEffect(() => {
    const unsub = subscribeAuth((user, mode) => {
      setCurrentUser(user);
      setViewMode(mode);
    });

    const handleOpenKahoot = () => {
      setActiveTab('exercises');
    };
    window.addEventListener('viblab_open_kahoot', handleOpenKahoot);

    return () => {
      unsub();
      window.removeEventListener('viblab_open_kahoot', handleOpenKahoot);
    };
  }, []);

  // Load Course data from SQLite
  useEffect(() => {
    let isMounted = true;
    async function loadSqliteCourse() {
      try {
        const list = await getAllCourses();
        if (isMounted && list && list.length > 0) {
          const hasModules = list.some(c => c.modules && c.modules.length > 0);
          if (hasModules) {
            setCourses(list);
          } else {
            setCourses(INITIAL_COURSES);
          }
        }
      } catch (err) {
        console.warn('Could not load courses from SQLite:', err);
      }
    }
    loadSqliteCourse();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync courses to localStorage
  const handleUpdateCourses = (updatedCourses: CourseData[]) => {
    setCourses(updatedCourses);
    try {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(updatedCourses));
    } catch (err) {
      console.error('Failed to save courses to localStorage', err);
    }
  };

  // Sync security settings to localStorage
  const handleUpdateSecuritySettings = (newSettings: SecuritySettings) => {
    setSecuritySettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SECURITY, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save security settings', err);
    }
  };

  // Escape key handler for fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenMode && onToggleFullScreenMode && !isViewerActive) {
        onToggleFullScreenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenMode, onToggleFullScreenMode, isViewerActive]);

  // Check if a module is unlocked based on QCM score (>= PASS %)
  const isModuleUnlocked = (moduleIndex: number): boolean => {
    if (viewMode === 'admin' || viewMode === 'formateur') return true;
    if (moduleIndex === 0) return true;
    try {
      const qKey = `viblab_qcm_prog_v1_${currentUser?.id || 'guest'}`;
      const saved = localStorage.getItem(qKey);
      if (saved) {
        const prog = JSON.parse(saved);
        const prev = prog[moduleIndex];
        return Boolean(prev?.passed && (prev?.best || 0) >= PASS);
      }
    } catch (e) {}
    return false;
  };

  // Launch the Secure HTML Course Player
  const launchSecurePlayer = (courseToPlay?: CourseData, moduleIndex: number = 0) => {
    if (viewMode === 'eleve' && !isModuleUnlocked(moduleIndex)) {
      const qKey = `viblab_qcm_prog_v1_${currentUser?.id || 'guest'}`;
      let bestScore = 0;
      try {
        const saved = localStorage.getItem(qKey);
        if (saved) {
          const prog = JSON.parse(saved);
          bestScore = prog[moduleIndex]?.best || 0;
        }
      } catch (e) {}

      const targetMod = (courseToPlay || activeCourse)?.modules?.[moduleIndex];
      setLockedModuleModal({
        targetModuleIndex: moduleIndex,
        requiredModuleIndex: moduleIndex, // 1-indexed required module
        title: targetMod?.title || `Module ${moduleIndex + 1}`,
        bestScore
      });
      return;
    }
    if (courseToPlay) {
      setActiveCourseId(courseToPlay.id);
    }
    setViewerInitialModuleIndex(moduleIndex);
    setIsViewerActive(true);
  };

  // View Switchers
  const handleRequestAdminAccess = () => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'formateur')) {
      setActiveViewMode('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleSwitchToStudentView = () => {
    setActiveViewMode('eleve');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setViewMode('eleve');
  };

  // Exercise Grading Handlers
  const checkAnswerL1 = (idx: number, val: string): boolean => {
    const clean = val.trim().toLowerCase();
    if (idx === 0) return clean === '25' || clean === '25 hz' || clean === '25hz';
    if (idx === 1) return clean === 'c' || clean === 'zone c' || clean === 'alerte';
    if (idx === 2) return clean.includes('goujon') || clean.includes('vis') || clean.includes('filet') || clean.includes('stud');
    return false;
  };

  const checkAnswerL2 = (idx: number, val: string): boolean => {
    const clean = val.trim().toLowerCase();
    if (idx === 0) return clean.includes('balourd') || clean.includes('unbalance') || clean.includes('desequilibre');
    if (idx === 1) return clean === '152.5' || clean === '152,5' || clean.includes('152.5 hz') || clean.includes('152.5hz');
    if (idx === 2) return clean.includes('desalignement') || clean.includes('désalignement') || clean.includes('misalignment') || clean.includes('lignage');
    return false;
  };

  const handleGradeL1 = () => {
    const results = userAnswersL1.map((ans, idx) => checkAnswerL1(idx, ans));
    setGradedL1(results);
    const score = results.filter(Boolean).length;
    setScoreL1(score);
  };

  const handleGradeL2 = () => {
    const results = userAnswersL2.map((ans, idx) => checkAnswerL2(idx, ans));
    setGradedL2(results);
    const score = results.filter(Boolean).length;
    setScoreL2(score);
  };

  const handleResetExercises = () => {
    setUserAnswersL1(['', '', '']);
    setGradedL1([false, false, false]);
    setScoreL1(null);
    setUserAnswersL2(['', '', '']);
    setGradedL2([false, false, false]);
    setScoreL2(null);
    setShowExerciseAnswers(false);
  };

  // If Secure Viewer is Active, render full secure player
  if (isViewerActive) {
    return (
      <SecureCourseViewer
        course={activeCourse}
        initialModuleIndex={viewerInitialModuleIndex}
        theme={theme}
        onClose={() => setIsViewerActive(false)}
        securitySettings={securitySettings}
        isTrainer={viewMode === 'formateur' || viewMode === 'admin'}
        currentUser={currentUser}
        onOpenQcm={(moduleId) => {
          setIsViewerActive(false);
          setActiveTab('exercises');
        }}
      />
    );
  }

  return (
    <div className={`space-y-6 ${isFullScreenMode ? 'w-full' : 'max-w-7xl mx-auto'}`}>
      {/* Full Screen Mode Notification Banner */}
      {isFullScreenMode && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fadeIn shadow-lg ${
          isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong>Mode Plein Écran Actif :</strong> L'en-tête, la barre latérale et le footer sont masqués pour maximiser la zone de lecture du cours.
            </span>
          </div>
          {onToggleFullScreenMode && (
            <button
              onClick={onToggleFullScreenMode}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shadow transition-all shrink-0"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Quitter Plein Écran (Échap)</span>
            </button>
          )}
        </div>
      )}

      {/* Sub-Navigation Header when on Exercises / QCM */}
      {activeTab === 'exercises' && (
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DA]">
          <button
            onClick={() => setActiveTab('slides')}
            className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#1F4E8C] hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            <span>‹ Retour au parcours de formation</span>
          </button>
          <span className="font-mono text-xs text-[#5B6675]">
            Évaluation & QCM Certifiant (Seuil 85%)
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ADMIN VIEW: COURSE ADMIN MANAGER                      */}
      {/* ========================================================= */}
      {viewMode === 'admin' && activeTab === 'slides' && (
        <CourseAdminManager
          courses={courses}
          onUpdateCourses={handleUpdateCourses}
          securitySettings={securitySettings}
          onUpdateSecuritySettings={handleUpdateSecuritySettings}
          onPreviewCourse={(course, idx = 0) => launchSecurePlayer(course, idx)}
          theme={theme}
          currentUser={currentUser}
          onSwitchToStudentView={handleSwitchToStudentView}
        />
      )}

      {/* ========================================================= */}
      {/* 2. TRAINER VIEW: TRAINER COURSE COCKPIT                  */}
      {/* ========================================================= */}
      {viewMode === 'formateur' && activeTab === 'slides' && (
        <TrainerCourseView
          course={activeCourse}
          currentUser={currentUser}
          onLaunchPresentation={(idx) => launchSecurePlayer(activeCourse, idx)}
          onOpenSimulator={onOpenSimulatorTab}
          theme={theme}
        />
      )}

      {/* ========================================================= */}
      {/* 3. STUDENT VIEW: STUDENT COURSE CARDS                    */}
      {/* ========================================================= */}
      {viewMode === 'eleve' && activeTab === 'slides' && (
        <StudentCourseView
          course={activeCourse}
          currentUser={currentUser}
          onOpenModule={(idx) => launchSecurePlayer(activeCourse, idx)}
          onOpenExercises={() => setActiveTab('exercises')}
          theme={theme}
        />
      )}

      {/* ========================================================= */}
      {/* 4. EXERCISES & QUIZ: CERTIFICATION QCM NIVEAU 1          */}
      {/* ========================================================= */}
      {activeTab === 'exercises' && (
        <FormationQcmModule
          currentUser={viewMode === 'eleve' ? (currentUser ? { ...currentUser, role: 'eleve' } : { id: 'student', username: 'eleve', fullName: 'Élève', email: '', role: 'eleve', isActive: true, createdAt: '' }) : currentUser}
          theme={theme}
          onOpenPresentation={(moduleId) => launchSecurePlayer(activeCourse, moduleId - 1)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setViewMode('admin');
        }}
        theme={theme}
      />

      {/* Locked Module Custom VibLab Modal */}
      {lockedModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1422]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E3E1DA] w-full max-w-[460px] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 pb-4 flex items-start justify-between gap-3 border-b border-[#EEECE6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FDF6E7] border border-[#F0D49A] flex items-center justify-center text-[#7A4A00] shrink-0">
                  <Lock className="w-5 h-5 text-[#E8A317]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10.5px] font-semibold text-[#5B6675] tracking-wider uppercase">
                    Condition de cursus · ISO 18436-2
                  </span>
                  <h3 className="text-[17px] font-semibold text-[#0F1B2D] m-0 leading-snug">
                    Module {lockedModuleModal.targetModuleIndex + 1} verrouillé
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setLockedModuleModal(null)}
                className="text-[#8A929C] hover:text-[#0F1B2D] p-1.5 rounded-md hover:bg-[#F3F2EE] cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[13.5px] font-semibold text-[#0F1B2D]">
                  {lockedModuleModal.title}
                </span>
                <p className="text-[13px] leading-relaxed text-[#5B6675] m-0">
                  Ce cours est verrouillé. Pour respecter la progression pédagogique certifiante, vous devez d'abord valider l'évaluation QCM du <strong>Module {lockedModuleModal.requiredModuleIndex}</strong> avec un score minimum de <strong>{PASS} %</strong>.
                </p>
              </div>

              {/* Score Benchmark Box */}
              <div className="bg-[#FAF9F6] border border-[#E3E1DA] rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] font-mono font-medium text-[#5B6675] uppercase">
                    Score Module {lockedModuleModal.requiredModuleIndex}
                  </span>
                  <span className={`text-[17px] font-semibold font-mono ${lockedModuleModal.bestScore >= PASS ? 'text-[#1E7A4F]' : 'text-[#7A4A00]'}`}>
                    {lockedModuleModal.bestScore > 0 ? `${lockedModuleModal.bestScore} %` : 'Non réalisé'}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-[#E3E1DA]" />
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-[10.5px] font-mono font-medium text-[#5B6675] uppercase">
                    Seuil de validation
                  </span>
                  <span className="text-[17px] font-semibold font-mono text-[#0F1B2D] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1E7A4F]" />
                    {PASS} %
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 pt-0 flex flex-col gap-2">
              <button
                onClick={() => {
                  setLockedModuleModal(null);
                  setActiveTab('exercises');
                }}
                className="w-full h-10 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white rounded-md text-[13.5px] font-medium flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Award className="w-4 h-4 text-[#E8A317]" />
                <span>Passer le QCM du Module {lockedModuleModal.requiredModuleIndex}</span>
              </button>

              <button
                onClick={() => setLockedModuleModal(null)}
                className="w-full h-9 bg-white border border-[#D6D3CA] hover:bg-[#FAF9F6] text-[#5B6675] hover:text-[#0F1B2D] rounded-md text-[13px] font-medium cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
