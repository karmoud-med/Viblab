import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Lock, 
  Play, 
  Award,
  ChevronRight,
  X,
  ShieldCheck
} from 'lucide-react';
import { CourseData, CourseModule, User, UserProgress, UserCourseStatus } from '../types/course';
import { getUserProgress, getUserQuizResults, getUserCourseStatus } from '../services/sqliteDatabase';
import { PASS } from './formation/formationData';

interface StudentCourseViewProps {
  course: CourseData;
  currentUser: User | null;
  onOpenModule: (moduleIndex: number) => void;
  onOpenExercises: (moduleIndex?: number) => void;
  theme: 'dark' | 'light' | 'mono';
}

export default function StudentCourseView({
  course,
  currentUser,
  onOpenModule,
  onOpenExercises,
  theme
}: StudentCourseViewProps) {
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [qcmProg, setQcmProg] = useState<Record<number, any>>({});
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [lockAlertMsg, setLockAlertMsg] = useState<string | null>(null);

  // VibLab modal for locked course modules
  const [lockedModal, setLockedModal] = useState<{
    targetIndex: number;
    requiredIndex: number;
    title: string;
    bestScore: number;
  } | null>(null);

  const [courseStatus, setCourseStatus] = useState<UserCourseStatus | null>(null);

  // Load progress and quiz results from SQLite
  useEffect(() => {
    let isMounted = true;

    async function fetchAllFromSqlite() {
      if (!currentUser?.id) return;
      try {
        const p = await getUserProgress(currentUser.id);
        if (isMounted) setProgressMap(p);
      } catch (err) {}

      try {
        const sqlQuiz = await getUserQuizResults(currentUser.id);
        if (isMounted && sqlQuiz && Object.keys(sqlQuiz).length > 0) {
          const mapped: Record<number, any> = {};
          Object.values(sqlQuiz).forEach(item => {
            mapped[item.moduleNumber] = {
              best: item.bestScore,
              attempts: item.attempts,
              passed: item.passed
            };
          });
          setQcmProg(prev => ({ ...prev, ...mapped }));
        }
      } catch (err) {}

      try {
        const st = await getUserCourseStatus(currentUser.id);
        if (isMounted && st) setCourseStatus(st);
      } catch (err) {}
    }

    fetchAllFromSqlite();

    const handleUpdate = () => {
      fetchAllFromSqlite();
    };
    window.addEventListener('viblab_progress_updated', handleUpdate);

    // Fallback localStorage cache
    try {
      const qKey = `viblab_qcm_prog_v1_${currentUser?.id || 'guest'}`;
      const saved = localStorage.getItem(qKey);
      if (saved && isMounted) {
        setQcmProg(prev => ({ ...JSON.parse(saved), ...prev }));
      }
    } catch (e) {}

    return () => {
      isMounted = false;
      window.removeEventListener('viblab_progress_updated', handleUpdate);
    };
  }, [currentUser]);

  const modules = course.modules || [];

  // Check if a module is unlocked based on QCM score rule (>= PASS %)
  // Module 1 is open by default. Subsequent modules strictly require >= PASS % on previous module QCM.
  const isModuleUnlocked = (actualIndex: number): boolean => {
    if (actualIndex === 0) return true;
    const prevStatus = qcmProg[actualIndex];
    return Boolean(prevStatus?.passed && (prevStatus?.best || 0) >= PASS);
  };

  const handleOpenModuleSafely = (actualIndex: number) => {
    if (!isModuleUnlocked(actualIndex)) {
      const prevStatus = qcmProg[actualIndex];
      setLockedModal({
        targetIndex: actualIndex,
        requiredIndex: actualIndex,
        title: modules[actualIndex]?.title || `Module ${actualIndex + 1}`,
        bestScore: prevStatus?.best || 0
      });
      return;
    }
    onOpenModule(actualIndex);
  };

  const completedCount = modules.filter((_, idx) => Boolean(qcmProg[idx + 1]?.passed)).length;
  const overallPercent = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  // Determine current active module (first incomplete unlocked module)
  const currentActiveIndex = modules.findIndex((_, idx) => !qcmProg[idx + 1]?.passed && isModuleUnlocked(idx));
  const activeIdx = currentActiveIndex === -1 ? (completedCount === modules.length ? modules.length - 1 : 0) : currentActiveIndex;

  const filteredModules = modules.map((mod, idx) => ({ mod, idx })).filter(({ idx }) => {
    const isComp = Boolean(qcmProg[idx + 1]?.passed);
    if (filter === 'completed') return isComp;
    if (filter === 'in_progress') return !isComp;
    return true;
  });

  return (
    <div className="flex flex-col gap-7 max-w-6xl mx-auto">

      {/* Screen 1b Hero Block: Left Title/Description, Right Dark Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-stretch">
        <div className="flex flex-col gap-2.5 py-1">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-[#5B6675] tracking-wider uppercase">
            <span>Formation certifiante</span>
            <span className="text-[#B8B5AC]">·</span>
            <span>ISO 18436-2 — VCAT-I</span>
          </div>
          <h1 className="m-0 text-[30px] font-semibold leading-tight text-[#0F1B2D] tracking-tight">
            {course.title || 'Vibrations Niveau 1'}
          </h1>
          <p className="m-0 text-[14.5px] leading-relaxed text-[#3A4552] max-w-xl">
            Parcours officiel complet d'analyse vibratoire des machines tournantes. Pour valider votre cursus et déverrouiller chaque module, réussissez le QCM associé avec au moins <strong className="text-[#0F1B2D]">{PASS} %</strong> de bonnes réponses.
          </p>
        </div>

        {/* Validation Niveau 1 Dark Card */}
        <div className="bg-[#0F1B2D] rounded-xl p-5 flex flex-col justify-between gap-3.5 text-white shadow-sm">
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] font-medium tracking-wider text-[#A9B4C2] uppercase">
              Validation Niveau 1
            </span>
            <span className="font-mono text-xs text-[#A9B4C2]">
              {completedCount} / {modules.length}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[38px] font-semibold tracking-tight leading-none">
              {overallPercent} %
            </span>
            <span className="text-xs text-[#A9B4C2]">
              {modules.length - completedCount === 0 ? 'Formation certifiée' : `${modules.length - completedCount} modules restants`}
            </span>
          </div>

          {/* 7-Segment Progress Bar */}
          <div className="grid grid-cols-7 gap-1">
            {modules.map((_, i) => {
              const isDone = Boolean(qcmProg[i + 1]?.passed);
              const isCurrent = i === activeIdx && !isDone;
              return (
                <span
                  key={i}
                  className={`h-1.5 rounded-xs transition-all ${
                    isDone 
                      ? 'bg-[#E8A317]' 
                      : isCurrent 
                        ? 'bg-[#5E7896]' 
                        : 'bg-[#2A3B52]'
                  }`}
                  title={`Module ${i + 1} : ${isDone ? 'Validé' : (isCurrent ? 'En cours' : 'Verrouillé')}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Section Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-[#0F1B2D]">
            Votre parcours
          </span>
          <div className="flex gap-1 text-[13px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#0F1B2D] text-white'
                  : 'text-[#5B6675] hover:bg-[#F3F2EE]'
              }`}
            >
              Tous · {modules.length}
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filter === 'in_progress'
                  ? 'bg-[#0F1B2D] text-white'
                  : 'text-[#5B6675] hover:bg-[#F3F2EE]'
              }`}
            >
              À valider · {modules.length - completedCount}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-[#0F1B2D] text-white'
                  : 'text-[#5B6675] hover:bg-[#F3F2EE]'
              }`}
            >
              Validés · {completedCount}
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Timeline Roadmap */}
      <div className="flex flex-col">
        {filteredModules.map(({ mod, idx }, listIdx) => {
          const actualIndex = idx;
          const isDone = Boolean(qcmProg[actualIndex + 1]?.passed);
          const isUnlocked = isModuleUnlocked(actualIndex);
          const isCurrent = actualIndex === activeIdx && !isDone;
          const isLocked = !isUnlocked;
          const isLast = listIdx === filteredModules.length - 1;
          const scoreStr = qcmProg[actualIndex + 1]?.best ? `${qcmProg[actualIndex + 1].best} %` : '—';

          return (
            <div key={mod.id} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
              {/* Left Timeline Indicator Column */}
              <div className="flex flex-col items-center">
                {isDone && (
                  <div className="w-8 h-8 rounded-full bg-[#1E7A4F] flex items-center justify-center mt-4.5 shrink-0 shadow-xs">
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  </div>
                )}
                {isCurrent && (
                  <div className="w-8 h-8 rounded-full bg-[#E8A317] text-[#0F1B2D] font-mono text-[13px] font-semibold flex items-center justify-center mt-4.5 shrink-0 ring-4 ring-[#E8A317]/25 shadow-xs">
                    {actualIndex + 1}
                  </div>
                )}
                {isLocked && (
                  <div className="w-8 h-8 rounded-full bg-white border border-[#D6D3CA] flex items-center justify-center mt-4.5 shrink-0">
                    <Lock className="w-3.5 h-3.5 text-[#8A929C] stroke-[2.2]" />
                  </div>
                )}
                {!isDone && !isCurrent && !isLocked && (
                  <div className="w-8 h-8 rounded-full bg-white border border-[#D6D3CA] font-mono text-[13px] text-[#5B6675] flex items-center justify-center mt-4.5 shrink-0">
                    {actualIndex + 1}
                  </div>
                )}
                
                {/* Vertical Connector Line */}
                {!isLast && (
                  <div className="flex-1 w-0.5 bg-[#E0DDD4] mt-1.5 min-h-[32px]" />
                )}
              </div>

              {/* Right Module Card */}
              <div className="pb-3.5 pt-1">
                {/* STATE 1: CURRENT ACTIVE MODULE */}
                {isCurrent && (
                  <div className="bg-white border border-[#0F1B2D] rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-[0_6px_20px_rgba(15,27,45,0.08)]">
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#5B6675]">
                          MODULE {actualIndex + 1}
                        </span>
                        <span className="text-[11.5px] font-semibold text-[#7A4A00] bg-[#FDF0D3] px-2 py-0.5 rounded-sm">
                          En cours
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#0F1B2D] m-0">
                        {mod.title}
                      </h3>
                      <p className="text-[13.5px] text-[#5B6675] leading-relaxed m-0">
                        {mod.subtitle || 'Introduction aux concepts vibratoires, cinématique et principes fondamentaux de surveillance.'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 font-mono text-xs text-[#5B6675]">
                        <span>{mod.durationMin || 45} min</span>
                        <span>·</span>
                        <span>QCM 30 Qs · seuil {PASS} %</span>
                        {qcmProg[actualIndex + 1]?.attempts > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[#9A5B00]">Meilleur score : {scoreStr}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-52 shrink-0">
                      <button
                        onClick={() => onOpenModule(actualIndex)}
                        className="flex items-center justify-center gap-2 h-10 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white rounded-md text-[13.5px] font-medium cursor-pointer shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Reprendre le cours</span>
                      </button>
                      <button
                        onClick={() => onOpenExercises(actualIndex + 1)}
                        className="flex items-center justify-center h-10 border border-[#D6D3CA] bg-white hover:bg-[#FAF9F6] text-[#0F1B2D] rounded-md text-[13.5px] font-medium cursor-pointer shadow-2xs transition-colors"
                      >
                        <span>Passer le QCM</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 2: VALIDATED MODULE */}
                {isDone && (
                  <div className="bg-white border border-[#E3E1DA] rounded-xl p-4.5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-[#D6D3CA] transition-colors">
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#5B6675]">
                          MODULE {actualIndex + 1}
                        </span>
                        <span className="text-[11.5px] font-semibold text-[#1E7A4F] bg-[#E3F1E9] px-2 py-0.5 rounded-sm">
                          Validé · {scoreStr}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#0F1B2D] m-0">
                        {mod.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-[13.5px] font-medium">
                      <button
                        onClick={() => onOpenModule(actualIndex)}
                        className="text-[#1F4E8C] hover:underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        Revoir le cours
                      </button>
                      <button
                        onClick={() => onOpenExercises(actualIndex + 1)}
                        className="text-[#1F4E8C] hover:underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        Mes résultats
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 3: LOCKED MODULE */}
                {isLocked && (
                  <div 
                    onClick={() => handleOpenModuleSafely(actualIndex)}
                    className="border border-dashed border-[#D6D3CA] bg-white/60 hover:bg-[#FAF9F6] rounded-xl p-4.5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#8A929C]">
                          MODULE {actualIndex + 1}
                        </span>
                        <span className="text-[11.5px] font-medium text-[#8A929C] bg-[#F0EFEA] px-2 py-0.5 rounded-sm">
                          Verrouillé
                        </span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#8A929C] group-hover:text-[#5B6675] m-0 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-[12.5px] text-[#8A929C] m-0 mt-0.5">
                        Réussissez le QCM du Module {actualIndex} avec au moins {PASS} % pour déverrouiller.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModuleSafely(actualIndex);
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 border border-[#D6D3CA] bg-white group-hover:bg-white text-[#0F1B2D] rounded-md text-xs font-medium cursor-pointer shadow-2xs transition-colors shrink-0"
                    >
                      <Lock className="w-3 h-3 text-[#E8A317]" />
                      <span>Débloquer</span>
                    </button>
                  </div>
                )}

                {/* UNLOCKED BUT NOT CURRENT AND NOT DONE */}
                {!isDone && !isCurrent && !isLocked && (
                  <div className="bg-white border border-[#E3E1DA] rounded-xl p-4.5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-[#D6D3CA] transition-colors">
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#5B6675]">
                          MODULE {actualIndex + 1}
                        </span>
                        <span className="text-[11.5px] font-medium text-[#5B6675] bg-[#F0EFEA] px-2 py-0.5 rounded-sm">
                          Déverrouillé
                        </span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#0F1B2D] m-0">
                        {mod.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onOpenModule(actualIndex)}
                        className="px-3 py-1.5 bg-[#0F1B2D] text-white rounded-md text-[13px] font-medium cursor-pointer"
                      >
                        Consulter
                      </button>
                      <button
                        onClick={() => onOpenExercises(actualIndex + 1)}
                        className="px-3 py-1.5 border border-[#D6D3CA] bg-white text-[#0F1B2D] rounded-md text-[13px] font-medium cursor-pointer"
                      >
                        QCM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom VibLab Modal for Locked Module */}
      {lockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1422]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E3E1DA] w-full max-w-[460px] overflow-hidden flex flex-col">
            {/* Header */}
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
                    Module {lockedModal.targetIndex + 1} verrouillé
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setLockedModal(null)}
                className="text-[#8A929C] hover:text-[#0F1B2D] p-1.5 rounded-md hover:bg-[#F3F2EE] cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[13.5px] font-semibold text-[#0F1B2D]">
                  {lockedModal.title}
                </span>
                <p className="text-[13px] leading-relaxed text-[#5B6675] m-0">
                  Ce cours est protégé. Pour garantir l'acquisition méthodique des compétences vibratoires, vous devez valider le QCM du <strong>Module {lockedModal.requiredIndex}</strong> avec un score minimum de <strong>{PASS} %</strong>.
                </p>
              </div>

              {/* Benchmark Box */}
              <div className="bg-[#FAF9F6] border border-[#E3E1DA] rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] font-mono font-medium text-[#5B6675] uppercase">
                    Votre score Module {lockedModal.requiredIndex}
                  </span>
                  <span className={`text-[17px] font-semibold font-mono ${lockedModal.bestScore >= PASS ? 'text-[#1E7A4F]' : 'text-[#7A4A00]'}`}>
                    {lockedModal.bestScore > 0 ? `${lockedModal.bestScore} %` : 'Non réalisé'}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-[#E3E1DA]" />
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-[10.5px] font-mono font-medium text-[#5B6675] uppercase">
                    Seuil requis
                  </span>
                  <span className="text-[17px] font-semibold font-mono text-[#0F1B2D] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1E7A4F]" />
                    {PASS} %
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex flex-col gap-2">
              <button
                onClick={() => {
                  const req = lockedModal.requiredIndex;
                  setLockedModal(null);
                  onOpenExercises(req);
                }}
                className="w-full h-10 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white rounded-md text-[13.5px] font-medium flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Award className="w-4 h-4 text-[#E8A317]" />
                <span>Passer le QCM du Module {lockedModal.requiredIndex}</span>
              </button>

              <button
                onClick={() => setLockedModal(null)}
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
