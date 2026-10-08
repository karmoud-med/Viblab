import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  X,
  BookOpen,
  Award,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { CourseData, CourseModule, User } from '../types/course';
import QuestionBankManager from './formation/QuestionBankManager';
import FormationLiveKahoot from './formation/FormationLiveKahoot';

interface TrainerCourseViewProps {
  course: CourseData;
  currentUser: User | null;
  onLaunchPresentation: (moduleIndex: number) => void;
  onOpenSimulator?: (tabId: string) => void;
  theme: 'dark' | 'light' | 'mono';
}

export default function TrainerCourseView({
  course,
  currentUser,
  onLaunchPresentation,
  onOpenSimulator,
  theme
}: TrainerCourseViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState<boolean>(false);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const [showSolutions, setShowSolutions] = useState<boolean>(false);

  // Live Kahoot state inside Trainer cockpit
  const [isLiveKahootOpen, setIsLiveKahootOpen] = useState<boolean>(false);
  const [liveKahootModuleId, setLiveKahootModuleId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const handleOpenKahoot = () => {
      setLiveKahootModuleId(undefined);
      setIsLiveKahootOpen(true);
    };
    window.addEventListener('viblab_open_kahoot', handleOpenKahoot);
    return () => window.removeEventListener('viblab_open_kahoot', handleOpenKahoot);
  }, []);

  // Trainer Chronometer
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isChronoRunning, setIsChronoRunning] = useState<boolean>(true);

  useEffect(() => {
    let interval: any = null;
    if (isChronoRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isChronoRunning]);

  const formatChrono = (secs: number) => {
    const hours = Math.floor(secs / 3600).toString().padStart(2, '0');
    const mins = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${hours}:${mins}:${s}`;
  };

  const modules: CourseModule[] = course.modules || [];

  // Traps and questions reference stats per module
  const moduleStats: Record<number, { qs: number; traps: number; dur: string }> = {
    0: { qs: 30, traps: 12, dur: '45 min' },
    1: { qs: 42, traps: 18, dur: '50 min' },
    2: { qs: 35, traps: 14, dur: '55 min' },
    3: { qs: 50, traps: 22, dur: '60 min' },
    4: { qs: 48, traps: 20, dur: '65 min' },
    5: { qs: 55, traps: 24, dur: '70 min' },
    6: { qs: 40, traps: 15, dur: '60 min' },
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Screen 1a Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-[#5B6675] tracking-wider uppercase">
            <span>Vibrations Niveau 1</span>
            <span className="text-[#B8B5AC]">·</span>
            <span>ISO 18436-2 — VCAT-I</span>
          </div>
          <h1 className="m-0 text-[28px] font-semibold leading-tight text-[#0F1B2D] tracking-tight">
            Cockpit formateur
          </h1>
          <p className="m-0 text-[14px] text-[#5B6675] max-w-xl">
            Projection en salle des modules avec notes formateur actives, chronomètre et corrigés officiels.
          </p>
        </div>

        {/* Action Buttons: Abaques, Questions & Pièges, Live Kahoot */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsToolsOpen(true)}
            className="flex items-center gap-2 h-[38px] px-3.5 border border-[#D6D3CA] bg-white rounded-md text-[13.5px] font-medium text-[#0F1B2D] hover:bg-[#F8F7F4] cursor-pointer shadow-2xs transition-colors"
          >
            <span>Abaques & outils</span>
          </button>

          <button
            onClick={() => setIsQuestionBankOpen(true)}
            className="flex items-center gap-2 h-[38px] px-3.5 border border-[#D6D3CA] bg-white rounded-md text-[13.5px] font-medium text-[#0F1B2D] hover:bg-[#F8F7F4] cursor-pointer shadow-2xs transition-colors"
          >
            <span>Questions & pièges</span>
          </button>

          <button
            onClick={() => {
              if (onOpenSimulator) {
                onOpenSimulator('sessions_attendance');
              } else {
                window.dispatchEvent(new CustomEvent('viblab_navigate_tab', { detail: 'sessions_attendance' }));
              }
            }}
            className="flex items-center gap-2 h-[38px] px-3.5 border border-[#0F766E] bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] rounded-md text-[13.5px] font-bold cursor-pointer shadow-2xs transition-colors"
            title="Gérer les présences de la cohorte et éditer la feuille officielle d'émargement Modèle 5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Émargement & Sessions (Modèle 5)</span>
          </button>

          <button
            onClick={() => {
              setLiveKahootModuleId(0); // 0 = Grand Kahoot Général (Tous les modules)
              setIsLiveKahootOpen(true);
            }}
            className="flex items-center gap-2 h-[38px] px-4 bg-[#E8A317] hover:bg-[#d89613] rounded-md text-[13.5px] font-semibold text-[#0F1B2D] cursor-pointer shadow-xs transition-colors"
            title="Lancer une session interactive Kahoot Live (Grand Kahoot Général ou par Module)"
          >
            <span className="w-2 h-2 rounded-full bg-[#0F1B2D] animate-pulse" />
            <span>Lancer Kahoot Live</span>
          </button>
        </div>
      </div>

      {/* Screen 1a Stats Strip (4 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-[#E3E1DA] rounded-xl overflow-hidden shadow-2xs divide-y md:divide-y-0 md:divide-x divide-[#EEECE6]">
        <div className="p-4.5 flex flex-col gap-1">
          <span className="text-xs text-[#5B6675]">Modules</span>
          <span className="text-[22px] font-semibold text-[#0F1B2D]">
            {modules.length}{' '}
            <span className="text-[13px] font-normal text-[#5B6675]">supports HTML</span>
          </span>
        </div>

        <div className="p-4.5 flex flex-col gap-1">
          <span className="text-xs text-[#5B6675]">Seuil de validation</span>
          <span className="text-[22px] font-semibold text-[#0F1B2D]">
            85 %
          </span>
        </div>

        <div className="p-4.5 flex flex-col gap-1">
          <span className="text-xs text-[#5B6675]">Banque de questions</span>
          <span className="text-[22px] font-semibold text-[#0F1B2D]">
            398{' '}
            <span className="text-[13px] font-normal text-[#5B6675]">dont 163 pièges</span>
          </span>
        </div>

        <div className="p-4.5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5B6675]">Durée totale</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#5B6675]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E7A4F] animate-pulse" />
              <span>Chrono: {formatChrono(secondsElapsed)}</span>
            </div>
          </div>
          <span className="text-[22px] font-semibold text-[#0F1B2D]">
            6 h 30
          </span>
        </div>
      </div>

      {/* Screen 1a Modules Table */}
      <div className="bg-white border border-[#E3E1DA] rounded-xl overflow-hidden shadow-2xs">
        {/* Table Header Row */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[#E3E1DA]">
          <span className="text-[15px] font-semibold text-[#0F1B2D]">
            Modules du parcours
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
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#0F1B2D] text-white'
                  : 'text-[#5B6675] hover:bg-[#F3F2EE]'
              }`}
            >
              À valider · {modules.length}
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filter === 'done'
                  ? 'bg-[#0F1B2D] text-white'
                  : 'text-[#5B6675] hover:bg-[#F3F2EE]'
              }`}
            >
              Validés · 0
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* Table Column Labels */}
            <div className="hidden md:grid grid-cols-[48px_minmax(220px,1fr)_75px_85px_85px_360px] gap-4 px-5 py-2.5 bg-[#FAF9F6] border-b border-[#E3E1DA] font-mono text-[11px] font-medium text-[#8A929C] tracking-wider uppercase">
              <span>N°</span>
              <span>Module</span>
              <span>Durée</span>
              <span>Questions</span>
              <span>Pièges</span>
              <span className="text-right pr-2">Actions</span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#EEECE6]">
              {modules.map((mod, idx) => {
                const stats = moduleStats[idx] || { qs: 35, traps: 15, dur: '50 min' };
                const numStr = String(idx + 1).padStart(2, '0');

                return (
                  <div
                    key={mod.id || idx}
                    className="grid grid-cols-1 md:grid-cols-[48px_minmax(220px,1fr)_75px_85px_85px_360px] gap-4 items-center px-5 py-3.5 hover:bg-[#FBFAF7] transition-colors"
                  >
                    {/* N° */}
                    <span className="font-mono text-[13px] font-semibold text-[#0F1B2D]">
                      {numStr}
                    </span>

                    {/* Module Title & Desc */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[14.5px] font-semibold text-[#0F1B2D]">
                        {mod.title}
                      </span>
                      <span className="text-[12.5px] text-[#5B6675] line-clamp-1">
                        {mod.subtitle || 'Surveillance conditionnelle, principes vibratoires et analyse spectrale'}
                      </span>
                    </div>

                    {/* Durée */}
                    <span className="font-mono text-[13px] font-medium text-[#3A4552]">
                      {mod.durationMin ? `${mod.durationMin} min` : stats.dur}
                    </span>

                    {/* Questions */}
                    <span className="font-mono text-[13px] font-medium text-[#3A4552]">
                      {stats.qs} Qs
                    </span>

                    {/* Pièges */}
                    <span className="font-mono text-[13px] font-medium text-[#9A5B00]">
                      {stats.traps} pièges
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 justify-end shrink-0 whitespace-nowrap">
                      <button
                        onClick={() => onLaunchPresentation(idx)}
                        className="flex items-center gap-1.5 h-8 px-3.5 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white rounded-md text-[13px] font-medium cursor-pointer shadow-2xs transition-colors shrink-0 whitespace-nowrap"
                        title={`Projeter le Module ${idx + 1}`}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Présenter</span>
                      </button>

                      <button
                        onClick={() => setIsQuestionBankOpen(true)}
                        className="flex items-center h-8 px-3.5 border border-[#D6D3CA] bg-white hover:bg-[#FAF9F6] text-[#0F1B2D] rounded-md text-[13px] font-medium cursor-pointer shadow-2xs transition-colors shrink-0 whitespace-nowrap"
                        title={`Voir les ${stats.qs} questions du Module ${idx + 1}`}
                      >
                        <span>QCM · 30 Qs</span>
                      </button>

                      <button
                        onClick={() => {
                          setLiveKahootModuleId(idx + 1);
                          setIsLiveKahootOpen(true);
                        }}
                        className="flex items-center gap-1.5 h-8 px-3.5 border border-[#F0D49A] bg-[#FDF6E7] hover:bg-[#faeed3] text-[#7A4A00] rounded-md text-[13px] font-semibold cursor-pointer shadow-2xs transition-colors shrink-0 whitespace-nowrap"
                        title={`Lancer une session Kahoot Live sur le Module ${idx + 1}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8A317] shrink-0" />
                        <span>Kahoot Live</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Bank Manager Modal Drawer */}
      {isQuestionBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E3E1DA] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E1DA]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#0F1B2D] uppercase tracking-wider">
                  Banque de Questions & Pièges
                </span>
                <span className="text-xs text-[#5B6675]">· 398 questions ISO 18436-2</span>
              </div>
              <button
                onClick={() => setIsQuestionBankOpen(false)}
                className="p-1.5 rounded-md text-[#5B6675] hover:text-[#0F1B2D] hover:bg-[#F3F2EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-[#F6F5F1]">
              <QuestionBankManager />
            </div>
          </div>
        </div>
      )}

      {/* Tools & Corrigés Drawer Modal */}
      {isToolsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#E3E1DA] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E1DA]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#0F1B2D] uppercase tracking-wider">
                  Abaques & Outils Formateur
                </span>
                <span className="text-xs text-[#5B6675]">· Norme ISO 10816-3 & Formulaire</span>
              </div>
              <button
                onClick={() => setIsToolsOpen(false)}
                className="p-1.5 rounded-md text-[#5B6675] hover:text-[#0F1B2D] hover:bg-[#F3F2EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F6F5F1]">
              {/* ISO 10816-3 Table Summary */}
              <div className="bg-white p-5 rounded-lg border border-[#E3E1DA]">
                <h3 className="text-base font-semibold text-[#0F1B2D] m-0 mb-2">
                  Tableau de sévérité ISO 10816-3 (Vitesse RMS mm/s)
                </h3>
                <p className="text-xs text-[#5B6675] mb-4">
                  Seuils d'alarme et d'arrêt pour machines tournantes Groupe 1 & 2 (fondation rigide et souple).
                </p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-3 bg-[#E3F1E9] text-[#1E7A4F] rounded border border-[#C2E3D0]">
                    <div className="font-bold text-sm">Zone A</div>
                    <div>&lt; 2.3 mm/s RMS</div>
                    <div className="text-[10px] opacity-80 mt-1">Machine neuve</div>
                  </div>
                  <div className="p-3 bg-[#F3F6FA] text-[#1F4E8C] rounded border border-[#D5E1F0]">
                    <div className="font-bold text-sm">Zone B</div>
                    <div>2.3 – 4.5 mm/s</div>
                    <div className="text-[10px] opacity-80 mt-1">Acceptable continu</div>
                  </div>
                  <div className="p-3 bg-[#FDF6E7] text-[#7A4A00] rounded border border-[#F0D49A]">
                    <div className="font-bold text-sm">Zone C</div>
                    <div>4.5 – 7.1 mm/s</div>
                    <div className="text-[10px] opacity-80 mt-1">Alarme / Restriction</div>
                  </div>
                  <div className="p-3 bg-[#FEE4E2] text-[#B42318] rounded border border-[#FECDCA]">
                    <div className="font-bold text-sm">Zone D</div>
                    <div>&gt; 7.1 mm/s RMS</div>
                    <div className="text-[10px] opacity-80 mt-1">Danger arrêt immédiat</div>
                  </div>
                </div>
              </div>

              {/* Formules et relations physiques */}
              <div className="bg-white p-5 rounded-lg border border-[#E3E1DA]">
                <h3 className="text-base font-semibold text-[#0F1B2D] m-0 mb-3">
                  Formulaire fondamental de vibration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF9F6] rounded border border-[#EEECE6] flex justify-between items-center">
                    <span className="font-medium text-[#0F1B2D]">Fréquence rotation :</span>
                    <span className="font-mono text-[#1F4E8C] font-semibold">f (Hz) = RPM / 60</span>
                  </div>
                  <div className="p-3 bg-[#FAF9F6] rounded border border-[#EEECE6] flex justify-between items-center">
                    <span className="font-medium text-[#0F1B2D]">Conversion vitesse / déplt :</span>
                    <span className="font-mono text-[#1F4E8C] font-semibold">V = 2π × f × D</span>
                  </div>
                  <div className="p-3 bg-[#FAF9F6] rounded border border-[#EEECE6] flex justify-between items-center">
                    <span className="font-medium text-[#0F1B2D]">Conversion accélération :</span>
                    <span className="font-mono text-[#1F4E8C] font-semibold">A = (2π × f)² × D</span>
                  </div>
                  <div className="p-3 bg-[#FAF9F6] rounded border border-[#EEECE6] flex justify-between items-center">
                    <span className="font-medium text-[#0F1B2D]">Facteur de crête :</span>
                    <span className="font-mono text-[#1F4E8C] font-semibold">CF = Vpeak / Vrms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Formation Live Kahoot Session in Trainer View */}
      {isLiveKahootOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1422] flex flex-col">
          <FormationLiveKahoot
            theme={theme}
            initialModuleId={liveKahootModuleId}
            onClose={() => setIsLiveKahootOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
