import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Clock, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  Play, 
  HelpCircle, 
  AlertCircle,
  AlertTriangle,
  Calculator,
  ChevronRight,
  ChevronLeft,
  XCircle,
  Sparkles,
  Sliders,
  Filter,
  ShieldCheck,
  Shuffle,
  Settings,
  Trophy,
  Users,
  Smartphone,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { 
  FormationModule, 
  FormationQuestion, 
  ModuleConfig,
  PASS as DEFAULT_PASS
} from './formation/formationData';
import { 
  loadFormationModules, 
  loadModuleConfigs, 
  prepareExamQuestions 
} from './formation/formationStore';
import FormationCalc, { ToolType, TOOLS_LABELS } from './formation/formationCalc';
import QuestionBankManager from './formation/QuestionBankManager';
import FormationLiveKahoot from './formation/FormationLiveKahoot';
import { User } from '../types/course';
import { saveQuizResult, getUserQuizResults } from '../services/sqliteDatabase';

interface FormationQcmModuleProps {
  currentUser?: User | null;
  theme?: 'dark' | 'light' | 'mono';
  onOpenPresentation?: (moduleId: number) => void;
  onUnlockModule?: (moduleId: number) => void;
}

export interface ModuleProgress {
  best: number;
  attempts: number;
  passed: boolean;
  last?: number;
}

export type ProgressMap = Record<number, ModuleProgress>;

const STORAGE_PREFIX = 'viblab_qcm_prog_v1_';

export default function FormationQcmModule({
  currentUser,
  theme = 'dark',
  onOpenPresentation,
  onUnlockModule
}: FormationQcmModuleProps) {
  const isLight = theme === 'light';
  const userId = currentUser?.id || 'guest';
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const isTrainerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'formateur';

  // Dynamic modules & configs from store
  const [modules, setModules] = useState<FormationModule[]>(() => loadFormationModules());
  const [configs, setConfigs] = useState<Record<number, ModuleConfig>>(() => loadModuleConfigs());

  // Management modal state
  const [showQuestionManager, setShowQuestionManager] = useState<boolean>(false);

  // Kahoot Live interactive session state
  const [showLiveKahoot, setShowLiveKahoot] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('kahoot_pin')) {
      return true;
    }
    return false;
  });
  const [kahootInitialModuleId, setKahootInitialModuleId] = useState<number>(1);

  // Sync with store updates
  useEffect(() => {
    const handleModulesUpdated = () => {
      setModules(loadFormationModules());
    };
    const handleConfigsUpdated = () => {
      setConfigs(loadModuleConfigs());
    };

    const handleOpenKahoot = () => {
      setShowLiveKahoot(true);
    };

    window.addEventListener('viblab_qcm_updated', handleModulesUpdated);
    window.addEventListener('viblab_qcm_configs_updated', handleConfigsUpdated);
    window.addEventListener('viblab_open_kahoot', handleOpenKahoot);

    return () => {
      window.removeEventListener('viblab_qcm_updated', handleModulesUpdated);
      window.removeEventListener('viblab_qcm_configs_updated', handleConfigsUpdated);
      window.removeEventListener('viblab_open_kahoot', handleOpenKahoot);
    };
  }, []);

  // Progress state
  const [prog, setProg] = useState<ProgressMap>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      1: { best: 0, attempts: 0, passed: false }
    };
  });

  // Sync with SQLite user_quiz_results
  useEffect(() => {
    async function loadSqliteQuiz() {
      if (!userId || userId === 'guest') return;
      try {
        const sqlQuiz = await getUserQuizResults(userId);
        if (sqlQuiz && Object.keys(sqlQuiz).length > 0) {
          setProg(prev => {
            const next = { ...prev };
            Object.values(sqlQuiz).forEach(item => {
              next[item.moduleNumber] = {
                attempts: Math.max(prev[item.moduleNumber]?.attempts || 0, item.attempts),
                best: Math.max(prev[item.moduleNumber]?.best || 0, item.bestScore),
                last: item.bestScore,
                passed: Boolean(prev[item.moduleNumber]?.passed || item.passed)
              };
            });
            return next;
          });
        }
      } catch (err) {
        console.warn('Error loading quiz progress from SQLite:', err);
      }
    }
    loadSqliteQuiz();
  }, [userId]);

  const saveProg = (newProg: ProgressMap) => {
    setProg(newProg);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProg));
    } catch (e) {}
  };

  // Helper unlock & passed checkers
  const isPassed = (id: number) => Boolean(prog[id]?.passed);
  const isUnlocked = (id: number) => {
    if (isTrainerOrAdmin) return true;
    if (id === 1) return true;
    return isPassed(id - 1);
  };

  // Navigation / View State
  const [view, setView] = useState<'list' | 'quiz' | 'result'>('list');
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [trainerRandomMode, setTrainerRandomMode] = useState<boolean>(true); // Le formateur a la main : Aléatoire vs Séquentiel
  const [activeModule, setActiveModule] = useState<FormationModule>(modules[0] || {} as any);
  const [qIndex, setQIndex] = useState<number>(0);

  // Quiz active session data
  const [quizQuestions, setQuizQuestions] = useState<FormationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);

  // Quiz result data
  const [quizResult, setQuizResult] = useState<{
    good: number;
    total: number;
    pct: number;
    pass: boolean;
    passThreshold: number;
    results: boolean[];
    questionsEvaluated: FormationQuestion[];
  } | null>(null);

  // Active Tool for Calc
  const [showCalc, setShowCalc] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<ToolType>('iso');
  const [activePre, setActivePre] = useState<any>({});
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Summary Metrics
  const completedCount = useMemo(() => {
    return modules.filter((m) => isPassed(m.id)).length;
  }, [prog, modules]);

  const globalPercent = Math.round((completedCount / (modules.length || 1)) * 100);
  const nextModuleToPass = useMemo(() => {
    return modules.find((m) => !isPassed(m.id) && isUnlocked(m.id));
  }, [prog, modules]);

  // Active module config
  const currentConfig: ModuleConfig = useMemo(() => {
    return configs[activeModule?.id] || {
      id: activeModule?.id || 1,
      title: activeModule?.title || '',
      desc: activeModule?.desc || '',
      min: 45,
      passScore: 85,
      questionsPerExam: 10,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowCalc: true,
      timeLimitMin: 25,
      showTrapBadgeDuringExam: false,
    };
  }, [configs, activeModule]);

  // Timer effect during active quiz
  useEffect(() => {
    if (view !== 'quiz' || timeLeftSec === null || timeLeftSec <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view, timeLeftSec]);

  // Start Quiz
  const handleStartQuiz = (mod: FormationModule) => {
    if (!isUnlocked(mod.id)) return;
    setActiveModule(mod);
    const rawConf = configs[mod.id] || {
      id: mod.id,
      title: mod.title,
      desc: mod.desc,
      min: 45,
      passScore: 85,
      questionsPerExam: 30,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowCalc: true,
      timeLimitMin: 45,
      showTrapBadgeDuringExam: false,
    };

    const modConf = {
      ...rawConf,
      shuffleQuestions: trainerRandomMode
    };

    // Prepare questions with random or sequential order
    const { questions } = prepareExamQuestions(mod, modConf);
    setQuizQuestions(questions);
    setQIndex(0);
    setAnswers({});
    setQuizResult(null);

    if (modConf.timeLimitMin > 0) {
      setTimeLeftSec(modConf.timeLimitMin * 60);
    } else {
      setTimeLeftSec(null);
    }

    setView('quiz');
    setShowCalc(false);
  };

  // Open Help Tool
  const handleOpenTool = (toolName: ToolType, preData: any) => {
    setActiveTool(toolName);
    setActivePre(preData || {});
    setShowCalc(true);
  };

  // Check if a question is answered
  const isQuestionAnswered = (idx: number) => {
    const val = answers[idx];
    if (val === undefined || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  };

  // Check answer correctness
  const checkAnswer = (q: FormationQuestion, userAns: any): boolean => {
    if (userAns === undefined || userAns === '') return false;
    if (q.type === 'num') {
      const v = parseFloat(String(userAns).replace(',', '.'));
      if (!Number.isFinite(v)) return false;
      return Math.abs(v - q.a) <= (q.tol ?? 0.1);
    }
    if (q.type === 'multi') {
      if (!Array.isArray(userAns)) return false;
      const expected = [...q.a].sort();
      const actual = [...userAns].sort();
      return (
        expected.length === actual.length &&
        expected.every((val, i) => val === actual[i])
      );
    }
    return userAns === q.a;
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    const questions = quizQuestions.length > 0 ? quizQuestions : activeModule.qs;
    const results = questions.map((q, i) => checkAnswer(q, answers[i]));
    const good = results.filter(Boolean).length;
    const total = questions.length;
    const pct = Math.round((good / total) * 100);
    const passThreshold = currentConfig.passScore || DEFAULT_PASS;
    const pass = pct >= passThreshold;

    const currentEntry = prog[activeModule.id] || { best: 0, attempts: 0, passed: false };
    const newEntry: ModuleProgress = {
      attempts: currentEntry.attempts + 1,
      best: Math.max(currentEntry.best, pct),
      last: pct,
      passed: currentEntry.passed || pass
    };

    const nextProg: ProgressMap = {
      ...prog,
      [activeModule.id]: newEntry
    };

    // Unlock next module if passed
    if (pass && activeModule.id < modules.length) {
      if (!nextProg[activeModule.id + 1]) {
        nextProg[activeModule.id + 1] = { best: 0, attempts: 0, passed: false };
      }
      onUnlockModule?.(activeModule.id + 1);
    }

    saveProg(nextProg);
    if (userId && userId !== 'guest') {
      saveQuizResult(userId, activeModule.id, pct, pass).catch((err) =>
        console.warn('Error recording quiz result in SQLite database:', err)
      );
    }
    window.dispatchEvent(new CustomEvent('viblab_progress_updated'));
    setQuizResult({
      good,
      total,
      pct,
      pass,
      passThreshold,
      results,
      questionsEvaluated: questions
    });
    setView('result');
  };

  // Reset all progress
  const handleResetAll = () => {
    if (window.confirm('Voulez-vous réinitialiser toute votre progression de QCM et reverrouiller les modules suivants ?')) {
      const resetMap: ProgressMap = {
        1: { best: 0, attempts: 0, passed: false }
      };
      saveProg(resetMap);
      setView('list');
    }
  };

  // Format timer seconds to mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`space-y-6 max-w-7xl mx-auto transition-colors duration-200 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
      
      {/* ------------------------------------------------------------------- */}
      {/* VIEW 1: MODULES LIST & PROGRESSION                                 */}
      {/* ------------------------------------------------------------------- */}
      {view === 'list' && (
        <div className="space-y-6">
          
          {/* Hero Banner (VibLab Clean Industrial Style) */}
          <div className="p-6 rounded-xl border border-[#E3E1DA] bg-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F3F6FA] text-[#1F4E8C] border border-[#D4E2F1]">
                  ESPACE APPRENANT · VUE ÉLÈVE
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FAF9F6] border border-[#E3E1DA] text-[#5B6675]">
                  ISO 18436-2 — VCAT-I
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FDF6E7] text-[#7A4A00] border border-[#F1D699] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#E8A317]" />
                  Pièges de diagnostic intégrés
                </span>
              </div>

              <h1 className="text-2xl font-semibold text-[#0F1B2D] tracking-tight">
                Vibrations Niveau 1 — Validation Certifiante & Pièges
              </h1>

              <p className="text-[13px] text-[#5B6675] leading-relaxed">
                Progression séquentielle stricte : chaque module se déverrouille lorsque le QCM du module précédent est validé avec au moins{' '}
                <strong className="text-[#0F1B2D] font-semibold">85 %</strong> de bonnes réponses. Les questions intègrent des cas réels d'atelier et pièges de diagnostic.
              </p>
            </div>

            {/* Progression Card */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="p-4 rounded-xl border border-[#E3E1DA] bg-[#FAF9F6] flex flex-col items-center justify-center min-w-[200px] shrink-0">
                <span className="text-[11px] font-mono font-semibold text-[#8A929C] uppercase tracking-wider mb-1">
                  Progression Globale
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-mono font-bold text-[#0F1B2D]">
                    {globalPercent}%
                  </span>
                  <span className="text-xs font-mono font-medium text-[#5B6675]">
                    ({completedCount}/{modules.length})
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E3E1DA] overflow-hidden mt-2.5">
                  <div
                    className="h-full bg-[#E8A317] rounded-full transition-all duration-500"
                    style={{ width: `${globalPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-[#5B6675] mt-2">
                  {completedCount === modules.length
                    ? 'Niveau 1 validé'
                    : `${modules.length - completedCount} module(s) restant(s)`}
                </span>
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono font-semibold text-[#8A929C] uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#5B6675]" />
                Filtrer :
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {[
                  { key: 'all', label: `Tous · ${modules.length}` },
                  { key: 'todo', label: `À valider · ${modules.length - completedCount}` },
                  { key: 'done', label: `Validés · ${completedCount}` }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key as any)}
                    className={`h-[32px] px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      filter === f.key
                        ? 'bg-[#0F1B2D] text-white border-[#0F1B2D]'
                        : 'bg-white border-[#D6D3CA] text-[#0F1B2D] hover:bg-[#F6F5F1]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Question Manager Button (Admin & Trainer) */}
              <button
                onClick={() => setShowQuestionManager(true)}
                className="h-[38px] px-3.5 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-[13px] font-medium flex items-center gap-2 transition cursor-pointer"
                title="Gérer la banque de questions, pièges et seuils"
              >
                <Sliders className="w-3.5 h-3.5 text-[#5B6675]" />
                <span>Gérer les Questions</span>
              </button>

              {/* Kahoot Live Session Button - Formateur & Admin */}
              {isTrainerOrAdmin && (
                <button
                  onClick={() => {
                    setKahootInitialModuleId(0); // 0 = Grand Kahoot Général
                    setShowLiveKahoot(true);
                  }}
                  className="h-[38px] px-4 rounded-lg bg-[#E8A317] hover:bg-[#D99510] text-[#0F1B2D] text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
                  title="Lancer une session interactive Kahoot Live"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#0F1B2D]" />
                  <span>● Lancer Kahoot Live</span>
                </button>
              )}

              {/* Trainer / Admin Quick Random Toggle */}
              {isTrainerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setTrainerRandomMode(!trainerRandomMode)}
                  className={`h-[38px] px-3.5 rounded-lg border text-[13px] font-medium flex items-center gap-2 transition cursor-pointer ${
                    trainerRandomMode
                      ? 'bg-[#EDE9FE] border-[#C4B5FD] text-[#6D28D9]'
                      : 'bg-white border-[#D6D3CA] text-[#5B6675] hover:text-[#0F1B2D]'
                  }`}
                  title="Ordre des questions dans les examens QCM : Aléatoire ou Séquentiel"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>QCM : {trainerRandomMode ? 'Aléatoire 🔀' : 'Séquentiel 🔢'}</span>
                </button>
              )}

              <button
                onClick={() => setShowCalc(!showCalc)}
                className={`h-[38px] px-3.5 rounded-lg border text-[13px] font-medium flex items-center gap-2 transition cursor-pointer ${
                  showCalc
                    ? 'bg-[#0F1B2D] border-[#0F1B2D] text-white'
                    : 'bg-white border-[#D6D3CA] text-[#0F1B2D] hover:bg-[#F6F5F1]'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Abaques & Outils</span>
              </button>

              {nextModuleToPass && (
                <button
                  onClick={() => handleStartQuiz(nextModuleToPass)}
                  className="h-[38px] px-4 rounded-lg bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white text-[13px] font-medium flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <span>Passer au QCM · Module {nextModuleToPass.id}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Standalone Calculator Drawer/Panel */}
          {showCalc && (
            <div className="animate-fade-in">
              <FormationCalc
                initialTool={activeTool}
                initialPre={activePre}
                theme="light"
                onClose={() => setShowCalc(false)}
              />
            </div>
          )}

          {/* Grid of Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.filter((m) => {
              const ok = isPassed(m.id);
              if (filter === 'done') return ok;
              if (filter === 'todo') return !ok;
              return true;
            }).map((mod) => {
              const ok = isPassed(mod.id);
              const open = isUnlocked(mod.id);
              const p = prog[mod.id];
              const conf = configs[mod.id];
              const passPct = conf?.passScore || DEFAULT_PASS;
              const trapCount = mod.qs.filter(q => q.isTrap).length;
              const activeQsCount = mod.qs.filter(q => q.enabled !== false).length;

              return (
                <div
                  key={mod.id}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                    ok
                      ? 'bg-white border-[#B8DFCA]'
                      : open
                      ? 'bg-white border-[#E3E1DA] hover:border-[#0F1B2D]'
                      : 'bg-[#FAF9F6] border-dashed border-[#D6D3CA] opacity-80'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          ok
                            ? 'bg-[#E3F1E9] text-[#1E7A4F] border-[#B8DFCA]'
                            : open
                            ? 'bg-[#F3F6FA] text-[#1F4E8C] border-[#D4E2F1]'
                            : 'bg-[#FAF9F6] text-[#8A929C] border-[#E3E1DA]'
                        }`}>
                          MODULE {mod.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border bg-[#FAF9F6] text-[#5B6675] border-[#E3E1DA]">
                          Seuil {passPct}%
                        </span>
                      </div>

                      {ok ? (
                        <span className="flex items-center gap-1 text-xs font-mono font-semibold text-[#1E7A4F]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validé · {p?.best}%
                        </span>
                      ) : open ? (
                        <span className="flex items-center gap-1 text-xs font-mono font-medium text-[#1F4E8C]">
                          <Award className="w-3.5 h-3.5" />
                          {p?.attempts ? `Meilleur : ${p.best}%` : 'À valider'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-mono text-[#8A929C]">
                          <Lock className="w-3.5 h-3.5" />
                          Verrouillé
                        </span>
                      )}
                    </div>

                    <h3 className="text-[15px] font-semibold mb-1.5 leading-snug text-[#0F1B2D]">
                      {mod.plain ? '' : `Module ${mod.id} : `}{mod.title}
                    </h3>

                    <p className="text-xs text-[#5B6675] leading-relaxed mb-4">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Card Footer: Metadata & Actions */}
                  <div className="space-y-3 pt-3 border-t border-[#EEECE6]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5B6675]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#5B6675]" />
                        {mod.min} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold">
                          {activeQsCount < mod.qs.length ? `${activeQsCount}/${mod.qs.length} Qs` : `${mod.qs.length} Qs`}
                        </span>
                        {trapCount > 0 && (
                          <span className="font-semibold text-[#7A4A00] flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {trapCount} pièges
                          </span>
                        )}
                        <span>· {p?.attempts || 0} essai(s)</span>
                      </span>
                    </div>

                    {open ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onOpenPresentation?.(mod.id)}
                            className="h-[36px] px-3 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-[#5B6675]" />
                            <span>Présentation</span>
                          </button>

                          <button
                            onClick={() => handleStartQuiz(mod)}
                            className="h-[36px] px-3 rounded-lg bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{ok ? 'Refaire (30 Qs)' : 'Passer (30 Qs)'}</span>
                          </button>
                        </div>

                        {/* Kahoot Live Launcher per Module - Formateur & Admin */}
                        {isTrainerOrAdmin && (
                          <button
                            onClick={() => {
                              setKahootInitialModuleId(mod.id);
                              setShowLiveKahoot(true);
                            }}
                            className="w-full h-[32px] px-3 rounded-lg border border-[#F1D699] bg-[#FDF6E7] hover:bg-[#FCEFD2] text-[#7A4A00] text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title={`Lancer un QCM Kahoot Live interactif sur le Module ${mod.id} (Formateur)`}
                          >
                            <Trophy className="w-3.5 h-3.5 text-[#E8A317]" />
                            <span>● Kahoot Live Formateur</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg border border-[#F1D699] bg-[#FDF6E7] text-[11px] text-[#7A4A00] flex items-center gap-2 font-medium">
                          <Lock className="w-3.5 h-3.5 shrink-0 text-[#E8A317]" />
                          <span>Réussissez le QCM du module {mod.id - 1} avec au moins {passPct} % pour déverrouiller.</span>
                        </div>
                        {isTrainerOrAdmin && (
                          <button
                            onClick={() => {
                              setKahootInitialModuleId(mod.id);
                              setShowLiveKahoot(true);
                            }}
                            className="w-full h-[32px] px-3 rounded-lg border border-[#F1D699] bg-[#FDF6E7] hover:bg-[#FCEFD2] text-[#7A4A00] text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                            title={`Lancer un QCM Kahoot Live de 20 questions sur le Module ${mod.id}`}
                          >
                            <Trophy className="w-3.5 h-3.5 text-[#E8A317]" />
                            <span>● Kahoot Live Formateur (20 Qs)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset progress footer button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleResetAll}
              className="text-xs font-bold text-slate-400 hover:text-red-500 underline transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser toute ma progression de QCM</span>
            </button>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* VIEW 2: ACTIVE QUIZ QUESTIONS SCREEN (VibLab Industrial Style)      */}
      {/* ------------------------------------------------------------------- */}
      {view === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Questions, Choices & Navigation (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="p-6 rounded-xl border border-[#E3E1DA] bg-white space-y-5">
              
              {/* Quiz Header & Navigation */}
              <div className="flex items-center justify-between border-b border-[#EEECE6] pb-4 flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (Object.keys(answers).length > 0) {
                      if (!window.confirm('Quitter le QCM en cours ? Vos réponses non validées seront perdues.')) return;
                    }
                    setView('list');
                  }}
                  className="h-[36px] px-3 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour au parcours</span>
                </button>

                <div className="flex items-center gap-2">
                  {timeLeftSec !== null && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border ${
                      timeLeftSec < 120
                        ? 'bg-[#FEE4E2] text-[#B42318] border-[#FECDCA] animate-pulse font-semibold'
                        : 'bg-[#FAF9F6] text-[#5B6675] border-[#E3E1DA]'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(timeLeftSec)}</span>
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#F3F6FA] text-[#1F4E8C] border border-[#D4E2F1]">
                    MODULE {activeModule.id} · QCM
                  </span>
                  <span className="text-xs font-mono text-[#5B6675]">
                    Seuil {currentConfig.passScore}%
                  </span>
                </div>
              </div>

              {/* Module Title */}
              <div>
                <span className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider">
                  ÉVALUATION DES COMPÉTENCES · ISO 18436-2
                </span>
                <h2 className="text-xl font-semibold text-[#0F1B2D] tracking-tight mt-0.5">
                  {activeModule.title}
                </h2>
                <p className="text-xs text-[#5B6675] mt-0.5">
                  {activeModule.desc}
                </p>
              </div>

              {/* Question Pagination Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(quizQuestions.length > 0 ? quizQuestions : activeModule.qs).map((q, i) => {
                  const answered = isQuestionAnswered(i);
                  const isCurrent = i === qIndex;

                  return (
                    <button
                      key={i}
                      onClick={() => setQIndex(i)}
                      className={`w-8 h-8 rounded-lg font-mono text-xs transition cursor-pointer flex items-center justify-center border ${
                        isCurrent
                          ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] font-bold shadow-xs'
                          : answered
                          ? 'bg-[#F3F6FA] border-[#D4E2F1] text-[#1F4E8C] font-semibold'
                          : 'bg-[#FAF9F6] border-[#E3E1DA] text-[#5B6675] hover:bg-[#F6F5F1]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question View */}
              {(() => {
                const qsList = quizQuestions.length > 0 ? quizQuestions : activeModule.qs;
                const q = qsList[qIndex] || qsList[0];
                const currentVal = answers[qIndex];
                const L = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono text-[#8A929C]">
                      <span>Question {qIndex + 1} sur {qsList.length}</span>
                      <div className="flex items-center gap-2">
                        {currentConfig.showTrapBadgeDuringExam && q.isTrap && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FDF6E7] text-[#7A4A00] border border-[#F1D699] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-[#E8A317]" />
                            Question Piège
                          </span>
                        )}
                        <span className="font-medium text-[#1F4E8C]">
                          {q.type === 'multi' ? 'Plusieurs réponses possibles' : q.type === 'num' ? 'Réponse numérique' : 'Choix unique'}
                        </span>
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <div className="text-[16px] md:text-[17px] font-semibold leading-relaxed text-[#1C2733]">
                      {q.t}
                    </div>

                    {/* Optional Question Image */}
                    {(q.image || (q as any).imageUrl) && (
                      <div className="p-3 rounded-xl border border-[#E3E1DA] bg-[#FAF9F6] flex flex-col items-center justify-center my-3">
                        <img
                          src={q.image || (q as any).imageUrl}
                          alt="Illustration de la question"
                          onClick={() => setZoomImage(q.image || (q as any).imageUrl || null)}
                          className="max-h-64 sm:max-h-72 max-w-full rounded-lg object-contain border border-[#EEECE6] shadow-xs cursor-pointer hover:opacity-95 transition"
                          title="Cliquer pour agrandir la photo"
                        />
                        <span className="text-[11px] font-mono text-[#8A929C] mt-1.5 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#0369A1]" />
                          <span>Schéma technique associé (Cliquer pour zoomer)</span>
                        </span>
                      </div>
                    )}

                    {/* Options or Numeric Input */}
                    {q.type === 'num' ? (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-medium text-[#1C2733] block">
                          Saisissez votre résultat numérique :
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={currentVal ?? ''}
                            onChange={(e) => setAnswers({ ...answers, [qIndex]: e.target.value })}
                            placeholder="Ex: 25.5"
                            className="flex-1 h-[42px] px-3.5 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] font-mono font-semibold text-base outline-none focus:border-[#0F1B2D]"
                          />
                          <span className="font-mono font-medium text-sm px-3.5 py-2.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6] text-[#1C2733]">
                            {q.unit}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2">
                        {q.o?.map((optText, oIdx) => {
                          const isSelected = q.type === 'multi'
                            ? Array.isArray(currentVal) && currentVal.includes(oIdx)
                            : currentVal === oIdx;

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (q.type === 'multi') {
                                  const cur = Array.isArray(currentVal) ? [...currentVal] : [];
                                  const next = cur.includes(oIdx)
                                    ? cur.filter((x) => x !== oIdx)
                                    : [...cur, oIdx];
                                  setAnswers({ ...answers, [qIndex]: next });
                                } else {
                                  setAnswers({ ...answers, [qIndex]: oIdx });
                                }
                              }}
                              className={`w-full p-3.5 rounded-lg border text-left text-[13.5px] flex items-start gap-3 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#F3F6FA] text-[#0F1B2D] border-[#1F4E8C] ring-1 ring-[#1F4E8C] font-medium'
                                  : 'bg-white hover:bg-[#FAF9F6] text-[#1C2733] border-[#E3E1DA]'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded text-xs font-mono font-semibold flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? 'bg-[#1F4E8C] text-white border-[#1F4E8C]'
                                  : 'bg-[#FAF9F6] border-[#D6D3CA] text-[#5B6675]'
                              }`}>
                                {L[oIdx]}
                              </span>
                              <span className="leading-snug pt-0.5">{optText}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Integrated Tool / Hint Box */}
                    {(q.hint || (q.tool && currentConfig.allowCalc)) && (
                      <div className="p-3.5 rounded-lg border border-[#D4E2F1] bg-[#F3F6FA] text-[#1F4E8C] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#1F4E8C]" />
                          <span>
                            <strong>Indication :</strong> {q.hint || 'Vous pouvez utiliser la calculatrice interactive pré-remplie.'}
                          </span>
                        </div>
                        {q.tool && currentConfig.allowCalc && (
                          <button
                            onClick={() => handleOpenTool(q.tool as ToolType, q.pre)}
                            className="h-[30px] px-3 rounded-lg bg-white border border-[#D4E2F1] hover:bg-[#E8EFF7] text-[#1F4E8C] font-medium text-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Ouvrir {TOOLS_LABELS[q.tool]} ›</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#EEECE6]">
                      <button
                        onClick={() => setQIndex(Math.max(0, qIndex - 1))}
                        disabled={qIndex === 0}
                        className="h-[38px] px-4 rounded-lg text-xs font-medium border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                      >
                        ‹ Précédente
                      </button>

                      <div className="flex items-center gap-2">
                        {qIndex < qsList.length - 1 ? (
                          <button
                            onClick={() => setQIndex(qIndex + 1)}
                            className="h-[38px] px-5 rounded-lg text-xs font-medium bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                          >
                            <span>Suivante</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmitQuiz}
                            disabled={!qsList.every((_, i) => isQuestionAnswered(i))}
                            className="h-[38px] px-6 rounded-lg text-xs font-medium bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white transition flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#1E7A4F]" />
                            <span>Valider le QCM</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Answers count feedback */}
                    <div className="text-[11px] text-center pt-1 font-mono text-[#5B6675]">
                      {qsList.filter((_, i) => isQuestionAnswered(i)).length} / {qsList.length} question(s) renseignée(s) · Seuil requis : {currentConfig.passScore}% ({Math.ceil((currentConfig.passScore / 100) * qsList.length)} / {qsList.length})
                    </div>

                  </div>
                );
              })()}

            </div>

          </div>

          {/* Right Column: Embedded Calculators & Abacus (5 cols) */}
          <div className="lg:col-span-5 sticky top-6">
            <FormationCalc
              initialTool={activeTool}
              initialPre={activePre}
              theme="light"
            />
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* VIEW 3: QUIZ RESULTS & CORRECTION BREAKDOWN (VibLab Industrial)      */}
      {/* ------------------------------------------------------------------- */}
      {view === 'result' && quizResult && (
        <div className="space-y-6">
          
          {/* Result Verdict Card */}
          <div className={`p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-6 ${
            quizResult.pass
              ? 'bg-[#E3F1E9] border-[#B8DFCA] text-[#1C2733]'
              : 'bg-[#FDF6E7] border-[#F1D699] text-[#1C2733]'
          }`}>
            <div className="flex items-center gap-6">
              {/* Circular Score Badge */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center p-2 shadow-xs shrink-0 bg-white border border-[#E3E1DA]"
              >
                <div className="flex flex-col items-center justify-center">
                  <span className={`text-2xl font-mono font-bold ${quizResult.pass ? 'text-[#1E7A4F]' : 'text-[#B42318]'}`}>
                    {quizResult.pct}%
                  </span>
                  <span className="text-[9px] font-mono text-[#8A929C] uppercase">Score</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase ${
                  quizResult.pass ? 'bg-white text-[#1E7A4F] border border-[#B8DFCA]' : 'bg-white text-[#7A4A00] border border-[#F1D699]'
                }`}>
                  {quizResult.pass ? 'QCM Validé avec Succès' : 'Seuil Non Atteint'}
                </span>
                <h2 className="text-xl font-semibold text-[#0F1B2D]">
                  {quizResult.pass ? 'Félicitations ! Module Validé' : 'Tentative Non Validée'}
                </h2>
                <p className="text-xs text-[#5B6675] leading-relaxed max-w-xl">
                  {quizResult.good} / {quizResult.total} bonnes réponses (Seuil requis : {quizResult.passThreshold} %).{' '}
                  {quizResult.pass
                    ? activeModule.id < modules.length
                      ? `Le Module ${activeModule.id + 1} est maintenant déverrouillé.`
                      : 'Vous avez validé l’intégralité du cursus Niveau 1 selon la norme ISO 18436-2.'
                    : 'Consultez la correction ci-dessous pour analyser les pièges, puis recommencez le test pour débloquer le module suivant.'}
                </p>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => handleStartQuiz(activeModule)}
                className="w-full sm:w-auto h-[38px] px-4 rounded-lg text-xs font-medium border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recommencer le QCM</span>
              </button>

              {quizResult.pass && activeModule.id < modules.length ? (
                <button
                  onClick={() => handleStartQuiz(modules[activeModule.id])}
                  className="w-full sm:w-auto h-[38px] px-5 rounded-lg text-xs font-medium bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <span>Module {activeModule.id + 1} : Passer le QCM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setView('list')}
                  className="w-full sm:w-auto h-[38px] px-5 rounded-lg text-xs font-medium bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <span>Retour au parcours</span>
                </button>
              )}
            </div>
          </div>

          {/* Question-by-question Review Cards */}
          <div className="space-y-4">
            <h3 className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8A317]" />
              CORRECTION DÉTAILLÉE & PIÈGES DÉJOUÉS :
            </h3>

            {quizResult.questionsEvaluated.map((q, i) => {
              const isCorrect = quizResult.results[i];
              const userAns = answers[i];
              const L = ['A', 'B', 'C', 'D', 'E', 'F'];

              return (
                <div
                  key={i}
                  className={`p-5 rounded-xl border bg-white space-y-3 transition ${
                    isCorrect
                      ? 'border-[#B8DFCA]'
                      : 'border-[#FECDCA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 text-white ${
                        isCorrect ? 'bg-[#1E7A4F]' : 'bg-[#B42318]'
                      }`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono font-semibold text-[#5B6675]">
                            Question {i + 1}
                          </span>
                          {q.isTrap && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FDF6E7] text-[#7A4A00] border border-[#F1D699] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-[#E8A317]" />
                              PIÈGE DE TERRAIN
                            </span>
                          )}
                          {q.gravity && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#5B6675] bg-[#FAF9F6] border border-[#E3E1DA]">
                              Gravité : {q.gravity.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[14.5px] font-semibold text-[#1C2733] leading-snug">
                          {q.t}
                        </h4>

                        {/* Optional Question Image in Review */}
                        {(q.image || (q as any).imageUrl) && (
                          <div className="my-2.5 p-2 bg-[#FAF9F6] border border-[#E3E1DA] rounded-lg inline-flex items-center gap-3">
                            <img
                              src={q.image || (q as any).imageUrl}
                              alt="Illustration"
                              onClick={() => setZoomImage(q.image || (q as any).imageUrl || null)}
                              className="h-16 max-w-[140px] object-cover rounded border border-[#D6D3CA] cursor-pointer hover:opacity-90 transition shadow-2xs"
                              title="Cliquer pour agrandir"
                            />
                            <div className="text-xs text-[#5B6675]">
                              <span className="font-semibold text-[#0F1B2D] block flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5 text-[#0369A1]" />
                                <span>Schéma / Spectre associé</span>
                              </span>
                              <span className="text-[11px] text-[#8A929C]">Cliquer pour afficher en grand</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium shrink-0 border ${
                      isCorrect
                        ? 'bg-[#E3F1E9] text-[#1E7A4F] border-[#B8DFCA]'
                        : 'bg-[#FEE4E2] text-[#B42318] border-[#FECDCA]'
                    }`}>
                      {isCorrect ? '+1 Point' : '0 Point'}
                    </span>
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className={`p-3 rounded-lg border ${
                      isCorrect
                        ? 'bg-[#E3F1E9] border-[#B8DFCA] text-[#1E7A4F]'
                        : 'bg-[#FEE4E2]/40 border-[#FECDCA] text-[#B42318]'
                    }`}>
                      <span className="block mb-1 font-mono text-[10px] uppercase tracking-wider text-[#5B6675]">
                        Votre réponse :
                      </span>
                      <span className="font-semibold text-sm">
                        {userAns === undefined || userAns === ''
                          ? '— (Aucune réponse)'
                          : q.type === 'num'
                          ? `${userAns} ${q.unit}`
                          : Array.isArray(userAns)
                          ? userAns.map(idx => `${L[idx]}. ${q.o[idx]}`).join(' ; ')
                          : `${L[userAns]}. ${q.o[userAns]}`}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6] text-[#1C2733]">
                      <span className="block mb-1 font-mono text-[10px] uppercase tracking-wider text-[#5B6675]">
                        Réponse attendue :
                      </span>
                      <span className="font-semibold text-sm text-[#1E7A4F]">
                        {q.type === 'num'
                          ? `${q.a} ${q.unit} (Tolérance : ± ${q.tol})`
                          : Array.isArray(q.a)
                          ? q.a.map(idx => `${L[idx]}. ${q.o[idx]}`).join(' ; ')
                          : `${L[q.a]}. ${q.o[q.a]}`}
                      </span>
                    </div>
                  </div>

                  {/* Trap specific breakdown callout */}
                  {q.isTrap && q.trapWarning && (
                    <div className="p-3 rounded-lg border border-[#F1D699] bg-[#FDF6E7] text-[#7A4A00] text-xs flex items-start gap-2.5 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E8A317]" />
                      <div>
                        <span className="font-bold">
                          {isCorrect ? 'PIÈGE DÉJOUÉ :' : 'PIÈGE DE TERRAIN IDENTIFIÉ :'}
                        </span>{' '}
                        {q.trapWarning}
                      </div>
                    </div>
                  )}

                  {/* Pedagogical Explanation */}
                  {q.e && (
                    <div className="p-3 rounded-lg border border-[#D4E2F1] bg-[#F3F6FA] text-[#1F4E8C] text-xs leading-relaxed">
                      <span className="font-bold">
                        Explication pédagogique :
                      </span>{' '}
                      {q.e}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* QUESTION BANK MANAGER MODAL */}
      {showQuestionManager && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-hidden">
          <div className="w-full max-w-6xl h-full max-h-[95vh] flex flex-col">
            <QuestionBankManager
              theme={theme}
              onClose={() => setShowQuestionManager(false)}
              initialModuleId={activeModule.id}
              currentUserRole={currentUser?.role || 'admin'}
            />
          </div>
        </div>
      )}

      {/* KAHOOT LIVE MULTIPLAYER INTERACTIVE SESSION */}
      {showLiveKahoot && (
        <FormationLiveKahoot
          theme={theme}
          initialModuleId={kahootInitialModuleId}
          onClose={() => setShowLiveKahoot(false)}
        />
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="Zoom question"
              className="max-h-[85vh] max-w-full rounded object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
}
