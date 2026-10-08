import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Trophy, 
  Users, 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  X, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  QrCode, 
  Smartphone, 
  Share2, 
  ChevronRight, 
  Award, 
  Flame, 
  UserPlus, 
  Sparkles, 
  Sliders,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  Calculator,
  Image as ImageIcon,
  Search,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react';
import { FormationModule, FormationQuestion } from './formationData';
import { 
  loadFormationModules, 
  saveFormationModules,
  loadKahootTrainerSettings,
  saveKahootTrainerSettings
} from './formationStore';
import FormationCalc, { ToolType, TOOLS_LABELS } from './formationCalc';

const normalizeTool = (t?: string): ToolType => {
  if (!t) return 'iso';
  const low = t.toLowerCase();
  if (low === 'conv' || low === 'unit') return 'conv';
  if (low === 'freq' || low === 'harmonics' || low === 'resonance' || low === 'gear') return 'freq';
  if (low === 'brg' || low === 'bearing') return 'brg';
  if (low === 'bal') return 'bal';
  return 'iso';
};

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  lastScoreGain: number;
  streak: number;
  answeredCurrent: boolean;
  currentAnswer?: number;
  currentAnswers?: number[];
  answerTimeSec?: number;
  isBot?: boolean;
}

const getPlayerAnswers = (p?: Player | null): number[] => {
  if (!p) return [];
  if (p.currentAnswers && p.currentAnswers.length > 0) return p.currentAnswers;
  if (p.currentAnswer !== undefined) return [p.currentAnswer];
  return [];
};

const isPlayerCorrect = (p: Player | undefined | null, q: any): boolean => {
  if (!p || !q) return false;
  const pAnswers = getPlayerAnswers(p);
  const targetAnswers: number[] = Array.isArray(q.a)
    ? q.a
    : (typeof q.a === 'number' ? [q.a] : []);
  if (pAnswers.length === 0 || targetAnswers.length === 0) return false;
  if (pAnswers.length !== targetAnswers.length) return false;
  const sortedP = [...pAnswers].sort((a, b) => a - b);
  const sortedT = [...targetAnswers].sort((a, b) => a - b);
  return sortedP.every((val, i) => val === sortedT[i]);
};

type KahootQuestion = FormationQuestion & {
  questionNumber: number;
};

interface FormationLiveKahootProps {
  theme?: 'dark' | 'light' | 'mono';
  onClose?: () => void;
  initialModuleId?: number;
}

// 4 iconic Kahoot-style answer colors and symbols matching VibLab industrial palette
const KAHOOT_TILES = [
  { 
    bg: 'bg-[#DC2626]', 
    hoverBg: 'hover:bg-[#B91C1C]', 
    border: 'border-[#EF4444]', 
    text: 'text-white', 
    shape: '▲', 
    label: 'A',
    colorHex: '#DC2626'
  },
  { 
    bg: 'bg-[#2563EB]', 
    hoverBg: 'hover:bg-[#1D4ED8]', 
    border: 'border-[#3B82F6]', 
    text: 'text-white', 
    shape: '◆', 
    label: 'B',
    colorHex: '#2563EB'
  },
  { 
    bg: 'bg-[#D97706]', 
    hoverBg: 'hover:bg-[#B45309]', 
    border: 'border-[#F59E0B]', 
    text: 'text-white', 
    shape: '●', 
    label: 'C',
    colorHex: '#D97706'
  },
  { 
    bg: 'bg-[#16A34A]', 
    hoverBg: 'hover:bg-[#15803D]', 
    border: 'border-[#22C55E]', 
    text: 'text-white', 
    shape: '■', 
    label: 'D',
    colorHex: '#16A34A'
  }
];

const BOT_NAMES = [
  { name: 'Équipe Alpha Vibrations', avatar: '⚡' },
  { name: 'Équipe Rotor & Paliers', avatar: '⚙️' },
  { name: 'Équipe Diagnostic Pro', avatar: '🔬' },
  { name: 'Équipe OCP Maintenance', avatar: '🏭' },
  { name: 'Karim — Inspecteur N1', avatar: '👨‍🔧' },
  { name: 'Yassine & Mehdi', avatar: '🚀' },
  { name: 'Siham — Fiabilité', avatar: '👩‍💻' },
  { name: 'Équipe Turbomachines', avatar: '🌪️' }
];

export default function FormationLiveKahoot({
  theme = 'dark',
  onClose,
  initialModuleId = 0
}: FormationLiveKahootProps) {
  const isLight = theme === 'light';

  // Load modules with live synchronization
  const [modules, setModules] = useState<FormationModule[]>(() => loadFormationModules());

  // Listen to external updates from QuestionBankManager
  useEffect(() => {
    const handleUpdate = () => {
      setModules(loadFormationModules());
    };
    window.addEventListener('viblab_qcm_updated', handleUpdate);
    window.addEventListener('viblab_kahoot_questions_updated', handleUpdate);
    return () => {
      window.removeEventListener('viblab_qcm_updated', handleUpdate);
      window.removeEventListener('viblab_kahoot_questions_updated', handleUpdate);
    };
  }, []);

  // Load memorized trainer settings from localStorage so nothing is lost upon refresh
  const savedSettings = useMemo(() => loadKahootTrainerSettings(), []);
  const [selectedModuleId, setSelectedModuleId] = useState<number>(() => savedSettings.selectedModuleId ?? initialModuleId);

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio synthesis helper for pleasant arcade sounds without external assets
  const playSound = (type: 'tick' | 'correct' | 'wrong' | 'start' | 'fanfare') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'tick') {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'fanfare') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        osc.frequency.setValueAtTime(1046.5, now + 0.45);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
      }
    } catch (e) {
      // AudioContext muted/blocked by browser
    }
  };

  // Check if opened via scanned QR code or shared direct link with PIN
  const queryPin = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('kahoot_pin') : null;
  const isJoinedViaUrl = Boolean(queryPin);

  // Session state
  const [pinCode] = useState<string>(() => {
    if (queryPin) return queryPin;
    return String(Math.floor(100000 + Math.random() * 900000));
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Flow Stage: 'lobby' | 'countdown' | 'question' | 'reveal' | 'leaderboard' | 'podium'
  const [stage, setStage] = useState<'lobby' | 'countdown' | 'question' | 'reveal' | 'leaderboard' | 'podium'>('lobby');

  // Session settings (Trainer configurable with persistent memory)
  const [timePerQuestion, setTimePerQuestion] = useState<number>(() => savedSettings.timePerQuestion ?? 30);
  const [questionCount, setQuestionCount] = useState<number>(() => savedSettings.questionCount ?? 20);
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'traps_only' | 'fundamentals'>(() => savedSettings.complexityFilter ?? 'all');
  const [isRandomOrder, setIsRandomOrder] = useState<boolean>(() => savedSettings.isRandomOrder ?? true);
  const [autoAdvanceOnAllAnswered, setAutoAdvanceOnAllAnswered] = useState<boolean>(() => savedSettings.autoAdvanceOnAllAnswered ?? true);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Automatically memorize trainer settings whenever changed
  useEffect(() => {
    saveKahootTrainerSettings({
      selectedModuleId,
      timePerQuestion,
      questionCount,
      complexityFilter,
      isRandomOrder,
      autoAdvanceOnAllAnswered
    });
  }, [selectedModuleId, timePerQuestion, questionCount, complexityFilter, isRandomOrder, autoAdvanceOnAllAnswered]);

  // Question Picker Modal inside Lobby
  const [showQuestionPicker, setShowQuestionPicker] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'selected' | 'unselected' | 'traps'>('all');

  // Toggle Kahoot inclusion for a single question
  const handleToggleQuestionInKahoot = (qText: string, modId?: number) => {
    const updated = modules.map(m => {
      if (modId === undefined || m.id === modId) {
        return {
          ...m,
          qs: m.qs.map(item => {
            if (item.t === qText) {
              return { ...item, inKahoot: !item.inKahoot };
            }
            return item;
          })
        };
      }
      return m;
    });
    setModules(updated);
    saveFormationModules(updated);
  };

  // Bulk toggle Kahoot questions
  const handleBulkToggleKahoot = (include: boolean, trapsOnly: boolean = false) => {
    const targetModuleIds = selectedModuleId === 0
      ? modules.map(m => m.id)
      : [selectedModuleId];

    const updated = modules.map(m => {
      if (targetModuleIds.includes(m.id)) {
        return {
          ...m,
          qs: m.qs.map(item => {
            const isEligible = (item.type === 'single' || item.type === 'multi') && Array.isArray(item.o) && item.o.length >= 2;
            if (!isEligible) return item;
            if (trapsOnly) {
              return { ...item, inKahoot: Boolean(item.isTrap) };
            }
            return { ...item, inKahoot: include };
          })
        };
      }
      return m;
    });
    setModules(updated);
    saveFormationModules(updated);
  };

  // Questions for this session
  const [sessionQuestions, setSessionQuestions] = useState<KahootQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);

  // Connected Players / Teams
  const [players, setPlayers] = useState<Player[]>([]);

  // Mobile / Student View Emulation Drawer (opens automatically if joined via QR code)
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(() => {
    return isJoinedViaUrl;
  });
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myPlayerNameInput, setMyPlayerNameInput] = useState<string>('');
  const [myPlayerAvatar, setMyPlayerAvatar] = useState<string>('⚡');
  
  // Modals for abacus and image zoom
  const [showTrainerAbacus, setShowTrainerAbacus] = useState<boolean>(false);
  const [showStudentAbacus, setShowStudentAbacus] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Local student multi-choice selection
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);

  // Reset student selection on new question / countdown
  useEffect(() => {
    setSelectedChoices([]);
  }, [currentQIndex, stage]);

  // BroadcastChannel reference for real-time multiplayer across tabs & windows
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Helper to send message to peers
  const broadcastMsg = (msg: any) => {
    const payload = { ...msg, pin: pinCode, timestamp: Date.now() };
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage(payload);
      } catch (e) {}
    }
    try {
      localStorage.setItem(`viblab_kahoot_msg_${pinCode}`, JSON.stringify(payload));
    } catch (e) {}
  };

  // Setup multi-device / multi-tab synchronization
  useEffect(() => {
    const channelName = `viblab_kahoot_ch_${pinCode}`;
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(channelName);
        broadcastRef.current = channel;
      }
    } catch (e) {}

    const handleIncomingMessage = (data: any) => {
      if (!data || data.pin !== pinCode) return;

      if (data.type === 'PLAYER_JOIN') {
        // Trainer receives new player
        setPlayers(prev => {
          if (prev.some(p => p.id === data.player.id)) return prev;
          return [...prev, data.player];
        });
      } else if (data.type === 'PLAYER_ANSWER') {
        // Trainer records player's answer (single or multiple choices)
        setPlayers(prev => prev.map(p => {
          if (p.id === data.playerId) {
            const rawAnswers: number[] = Array.isArray(data.choiceIndices)
              ? data.choiceIndices
              : (Array.isArray(data.choiceIndex)
                  ? data.choiceIndex
                  : (data.choiceIndex !== undefined ? [data.choiceIndex] : []));
            return {
              ...p,
              answeredCurrent: true,
              currentAnswer: rawAnswers[0],
              currentAnswers: rawAnswers,
              answerTimeSec: data.answerTimeSec
            };
          }
          return p;
        }));
      } else if (data.type === 'SYNC_STATE') {
        // Connected students receive session updates from trainer
        if (data.stage !== undefined) setStage(data.stage);
        if (data.countdownNum !== undefined) setCountdownNum(data.countdownNum);
        if (data.sessionQuestions !== undefined && data.sessionQuestions.length > 0) {
          setSessionQuestions(data.sessionQuestions);
        }
        if (data.currentQIndex !== undefined) setCurrentQIndex(data.currentQIndex);
        if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
        if (data.timePerQuestion !== undefined) setTimePerQuestion(data.timePerQuestion);
        if (data.questionCount !== undefined) setQuestionCount(data.questionCount);
        if (data.players !== undefined) setPlayers(data.players);
        if (data.selectedModuleId !== undefined) setSelectedModuleId(data.selectedModuleId);
      } else if (data.type === 'REQUEST_SYNC') {
        // New student requested session state
        if (!isJoinedViaUrl && sessionQuestions.length > 0) {
          broadcastMsg({
            type: 'SYNC_STATE',
            stage,
            countdownNum,
            sessionQuestions,
            currentQIndex,
            timeLeft,
            timePerQuestion,
            questionCount,
            players,
            selectedModuleId
          });
        }
      }
    };

    if (channel) {
      channel.onmessage = (event) => handleIncomingMessage(event.data);
    }

    // Storage event fallback for cross-tab sync
    const handleStorage = (event: StorageEvent) => {
      if (event.key === `viblab_kahoot_msg_${pinCode}` && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          handleIncomingMessage(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // If joining as student, request current session state
    if (isJoinedViaUrl) {
      setTimeout(() => {
        broadcastMsg({ type: 'REQUEST_SYNC' });
      }, 500);
    }

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [pinCode, isJoinedViaUrl, stage, countdownNum, sessionQuestions, currentQIndex, timeLeft, players, selectedModuleId]);

  // Compute join URL
  const joinUrl = useMemo(() => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    return `${origin}${path}?kahoot_pin=${pinCode}`;
  }, [pinCode]);

  // Generate QR Code on mount
  useEffect(() => {
    QRCode.toDataURL(
      joinUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [joinUrl]);

  // Active module object or Grand Kahoot representation (ModuleId === 0)
  const activeModule = useMemo(() => {
    if (selectedModuleId === 0) {
      const totalQs = modules.reduce((sum, m) => sum + m.qs.length, 0);
      return {
        id: 0,
        title: 'Grand Kahoot Général (Tous les Modules 1 à 7)',
        desc: `Banque complète de ${totalQs} questions couvrant l'ensemble du diagnostic vibratoire industriel.`,
        qs: modules.flatMap(m => m.qs)
      };
    }
    return modules.find(m => m.id === selectedModuleId) || modules[0];
  }, [modules, selectedModuleId]);

  // Total active questions in current selected scope
  const availableQuestionCount = useMemo(() => {
    if (selectedModuleId === 0) {
      return modules.flatMap(m => m.qs.filter(q => q.enabled !== false)).length;
    }
    const mod = modules.find(m => m.id === selectedModuleId);
    return (mod?.qs || []).filter(q => q.enabled !== false).length;
  }, [modules, selectedModuleId]);

  // Total questions specifically marked for Kahoot in current selected scope
  const activeKahootCount = useMemo(() => {
    if (selectedModuleId === 0) {
      return modules.flatMap(m => m.qs).filter(q => q.inKahoot === true).length;
    }
    const mod = modules.find(m => m.id === selectedModuleId);
    return (mod?.qs || []).filter(q => q.inKahoot === true).length;
  }, [modules, selectedModuleId]);

  // Prepare questions for session according to trainer options and admin configuration
  const prepareSessionQuestions = () => {
    let pool: FormationQuestion[] = [];

    if (selectedModuleId === 0) {
      // 🌐 Grand Kahoot Général : Questions de TOUS les modules 1 à 7
      const allActive = modules.flatMap(m => m.qs.filter(q => q.enabled !== false));
      pool = allActive.length > 0 ? allActive : modules.flatMap(m => m.qs);
    } else {
      const mod = modules.find(m => m.id === selectedModuleId) || activeModule;
      if (!mod || !mod.qs) return [];
      const activeQs = mod.qs.filter(q => q.enabled !== false);
      pool = activeQs.length > 0 ? activeQs : mod.qs;
    }

    // 1. Filtrer pour Kahoot : Kahoot nécessite des questions à choix avec des options définies (au moins 2)
    pool = pool.filter(q => (q.type === 'single' || q.type === 'multi') && Array.isArray(q.o) && q.o.length >= 2);

    // 2. Si le formateur ou l'administrateur a sélectionné des questions spécifiques pour le Kahoot
    const adminConfiguredForKahoot = pool.filter(q => q.inKahoot === true);
    if (adminConfiguredForKahoot.length > 0) {
      pool = adminConfiguredForKahoot;
    }

    // 3. Apply complexity filter
    if (complexityFilter === 'traps_only') {
      const traps = pool.filter(q => q.isTrap);
      if (traps.length >= 3) {
        pool = traps;
      }
    } else if (complexityFilter === 'fundamentals') {
      const direct = pool.filter(q => !q.isTrap);
      if (direct.length >= 3) {
        pool = direct;
      }
    }

    // 4. Ordre des questions : Le formateur a la main pour choisir Aléatoire ou Séquentiel
    const orderedPool = [...pool];
    if (isRandomOrder) {
      // Fisher-Yates shuffle
      for (let i = orderedPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedPool[i], orderedPool[j]] = [orderedPool[j], orderedPool[i]];
      }
    }

    // 5. Prendre le nombre souhaité de questions
    const countToTake = Math.min(questionCount, orderedPool.length);
    const picked: KahootQuestion[] = orderedPool.slice(0, countToTake).map((q, idx) => ({
      ...q,
      questionNumber: idx + 1
    }));

    return picked;
  };

  // Add sample virtual bot teams / players for easy testing & demo
  const handleAddSampleBots = () => {
    const existingCount = players.length;
    const newBots: Player[] = BOT_NAMES.slice(0, 4).map((bot, idx) => ({
      id: `bot_${existingCount + idx + 1}`,
      name: bot.name,
      avatar: bot.avatar,
      score: 0,
      lastScoreGain: 0,
      streak: 0,
      answeredCurrent: false,
      isBot: true
    }));
    setPlayers(prev => [...prev, ...newBots]);
    playSound('start');
  };

  // Start the Kahoot session
  const handleStartSession = () => {
    if (players.length === 0) {
      alert('Veuillez ajouter au moins un participant ou cliquer sur "+ Équipes démo (Test)".');
      return;
    }
    const qList = prepareSessionQuestions();
    if (qList.length === 0) {
      alert('Aucune question disponible avec les critères sélectionnés.');
      return;
    }
    setSessionQuestions(qList);
    setCurrentQIndex(0);
    setStage('countdown');
    setCountdownNum(3);
    playSound('start');

    broadcastMsg({
      type: 'SYNC_STATE',
      stage: 'countdown',
      countdownNum: 3,
      currentQIndex: 0,
      sessionQuestions: qList,
      timePerQuestion,
      questionCount,
      players,
      selectedModuleId
    });
  };

  // Countdown 3, 2, 1 before question
  useEffect(() => {
    if (stage !== 'countdown') return;

    if (countdownNum > 1) {
      const timer = setTimeout(() => {
        setCountdownNum(prev => {
          const next = prev - 1;
          broadcastMsg({
            type: 'SYNC_STATE',
            countdownNum: next
          });
          return next;
        });
        playSound('tick');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setStage('question');
        setTimeLeft(timePerQuestion);
        // Reset player answers for this question
        const resetPlayers = players.map(p => ({
          ...p,
          answeredCurrent: false,
          currentAnswer: undefined,
          currentAnswers: undefined,
          answerTimeSec: undefined
        }));
        setPlayers(resetPlayers);
        playSound('tick');

        broadcastMsg({
          type: 'SYNC_STATE',
          stage: 'question',
          timeLeft: timePerQuestion,
          currentQIndex,
          players: resetPlayers
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, countdownNum, timePerQuestion]);

  // Question Timer Countdown
  useEffect(() => {
    if (stage !== 'question') return;

    if (timeLeft <= 0) {
      // Time is up! Move to reveal stage
      handleRevealResult();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev <= 5) {
          playSound('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  // Simulate bots answering randomly with realistic response times
  useEffect(() => {
    if (stage !== 'question') return;

    const currentQ = sessionQuestions[currentQIndex];
    if (!currentQ) return;

    const botPlayers = players.filter(p => p.isBot && !p.answeredCurrent);
    if (botPlayers.length === 0) return;

    const timeouts = botPlayers.map(bot => {
      // Random answer delay between 3s and 18s
      const delayMs = Math.floor(3000 + Math.random() * 15000);
      return setTimeout(() => {
        // 75% probability of right answer for realism
        const isRight = Math.random() < 0.78;
        let chosenAnswers: number[];
        const isMulti = currentQ.type === 'multi' || Array.isArray(currentQ.a);
        const targetAnswers: number[] = Array.isArray(currentQ.a)
          ? currentQ.a
          : (typeof currentQ.a === 'number' ? [currentQ.a] : [0]);

        if (isMulti) {
          if (isRight) {
            chosenAnswers = [...targetAnswers];
          } else {
            // Pick a random subset of 1 to N-1 choices
            const numOpts = currentQ.o?.length || 4;
            const indices = Array.from({ length: numOpts }, (_, i) => i).sort(() => Math.random() - 0.5);
            chosenAnswers = indices.slice(0, Math.max(1, Math.floor(Math.random() * numOpts)));
          }
        } else {
          chosenAnswers = isRight 
            ? targetAnswers 
            : [Math.floor(Math.random() * (currentQ.o?.length || 4))];
        }

        setPlayers(prev => prev.map(p => {
          if (p.id === bot.id) {
            return {
              ...p,
              answeredCurrent: true,
              currentAnswer: chosenAnswers[0],
              currentAnswers: chosenAnswers,
              answerTimeSec: Math.round(delayMs / 1000)
            };
          }
          return p;
        }));
      }, delayMs);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [stage, currentQIndex, sessionQuestions]);

  // Stable reference to handleRevealResult for early finish
  const revealRef = useRef<() => void>(() => {});

  // End of Question -> Calculate scores & Show Reveal Screen
  const handleRevealResult = () => {
    const currentQ = sessionQuestions[currentQIndex];
    if (!currentQ) return;

    // Calculate score for each player
    const updatedPlayers = players.map(p => {
      const isCorrect = isPlayerCorrect(p, currentQ);

      if (isCorrect) {
        // Kahoot formula: Up to 1000 points based on speed
        const timeTaken = p.answerTimeSec || (timePerQuestion - timeLeft);
        const fraction = Math.max(0, 1 - (timeTaken / (2 * timePerQuestion)));
        const points = Math.round(1000 * fraction);
        return {
          ...p,
          score: p.score + points,
          lastScoreGain: points,
          streak: p.streak + 1
        };
      } else {
        return {
          ...p,
          lastScoreGain: 0,
          streak: 0
        };
      }
    });

    setPlayers(updatedPlayers);
    setStage('reveal');
    playSound('correct');

    broadcastMsg({
      type: 'SYNC_STATE',
      stage: 'reveal',
      players: updatedPlayers
    });
  };


  revealRef.current = handleRevealResult;

  // Immediately advance to reveal when all connected players/teams have answered!
  // Does NOT wait for countdown timer to run out!
  useEffect(() => {
    if (stage !== 'question') return;
    if (!autoAdvanceOnAllAnswered) return;
    if (players.length > 0 && players.every(p => p.answeredCurrent)) {
      // 350ms brief delay so button selection is registered cleanly
      const timer = setTimeout(() => {
        revealRef.current();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [stage, players, autoAdvanceOnAllAnswered]);

  // Next: from reveal to Leaderboard
  const handleGoToLeaderboard = () => {
    setStage('leaderboard');
    playSound('start');

    broadcastMsg({
      type: 'SYNC_STATE',
      stage: 'leaderboard',
      players
    });
  };

  // Next: from Leaderboard to next question or final Podium
  const handleNextQuestionOrPodium = () => {
    if (currentQIndex + 1 >= sessionQuestions.length) {
      setStage('podium');
      playSound('fanfare');

      broadcastMsg({
        type: 'SYNC_STATE',
        stage: 'podium',
        players
      });
    } else {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setStage('countdown');
      setCountdownNum(3);

      broadcastMsg({
        type: 'SYNC_STATE',
        stage: 'countdown',
        countdownNum: 3,
        currentQIndex: nextIdx,
        players
      });
    }
  };

  // Answer selection handler (for interactive player view)
  const handlePlayerSubmitAnswer = (choiceIndices: number | number[]) => {
    if (stage !== 'question') return;
    const timeTaken = timePerQuestion - timeLeft;
    const normalizedChoices: number[] = Array.isArray(choiceIndices) ? choiceIndices : [choiceIndices];

    setPlayers(prev => prev.map(p => {
      if (p.id === myPlayerId) {
        return {
          ...p,
          answeredCurrent: true,
          currentAnswer: normalizedChoices[0],
          currentAnswers: normalizedChoices,
          answerTimeSec: timeTaken
        };
      }
      return p;
    }));
    playSound('tick');

    broadcastMsg({
      type: 'PLAYER_ANSWER',
      playerId: myPlayerId,
      choiceIndices: normalizedChoices,
      choiceIndex: normalizedChoices[0],
      answerTimeSec: timeTaken
    });
  };

  // Join as a real player from inside the app
  const handleJoinMyself = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPlayerNameInput.trim()) return;

    const newId = `player_real_${Date.now()}`;
    const newP: Player = {
      id: newId,
      name: myPlayerNameInput.trim(),
      avatar: myPlayerAvatar,
      score: 0,
      lastScoreGain: 0,
      streak: 0,
      answeredCurrent: false,
      isBot: false
    };

    setPlayers(prev => [...prev, newP]);
    setMyPlayerId(newId);
    setMyPlayerNameInput('');
    playSound('start');

    broadcastMsg({
      type: 'PLAYER_JOIN',
      player: newP
    });
  };

  // Ranked players for leaderboard & podium
  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  const currentQ = sessionQuestions[currentQIndex] || sessionQuestions[0];
  const myPlayer = players.find(p => p.id === myPlayerId);

  // Count distribution of answers for reveal screen
  const answerDistribution = useMemo(() => {
    if (stage !== 'reveal') return [0, 0, 0, 0];
    const counts = [0, 0, 0, 0];
    players.forEach(p => {
      const answers = getPlayerAnswers(p);
      answers.forEach(ans => {
        if (ans >= 0 && ans < counts.length) {
          counts[ans]++;
        }
      });
    });
    return counts;
  }, [stage, players]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1422] text-[#E6EBF1] flex flex-col overflow-hidden select-none font-sans">
      
      {/* ========================================================================= */}
      {/* TOP BAR : 64px, #0B1422, border-b #1C2A3D (Matching screen 3a/b/c)         */}
      {/* ========================================================================= */}
      <div className="h-16 px-5 border-b border-[#1C2A3D] bg-[#0B1422] flex items-center justify-between shrink-0 z-20">
        
        {/* Left: VibLab wave icon + live dot + Kahoot live title */}
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-lg bg-[#13233A] border border-[#22344D] flex items-center justify-center shrink-0">
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M1 6c2-6 4-6 6 0s4 6 6 0 4-6 6 0" stroke="#E8A317" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="w-[7px] h-[7px] rounded-full bg-[#E5484D] animate-pulse" />
              Kahoot live
            </span>
            <span className="text-xs text-[#7F8B9A] truncate max-w-[260px] sm:max-w-[400px]">
              {selectedModuleId === 0
                ? 'Grand Kahoot général · Modules 1 à 7'
                : `Module ${selectedModuleId} · ${activeModule?.title || ''}`}
            </span>
          </div>
        </div>

        {/* Center: PIN block in Lobby, or Segmented tick progress bar during game */}
        <div className="hidden md:flex items-center justify-center gap-4 flex-1">
          {stage === 'lobby' ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 h-10 px-4 bg-[#111D2E] border border-[#1C2A3D] rounded-lg">
                <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#7F8B9A]">PIN</span>
                <span className="font-mono text-[22px] font-semibold tracking-[0.12em] text-[#E8A317]">{pinCode}</span>
              </div>
              <span className="font-mono text-[13px] font-medium text-[#A9B4C2]">
                {players.length} joueur{players.length > 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              {/* Segmented Progress ticks */}
              <div className="flex items-center gap-[3px]">
                {Array.from({ length: sessionQuestions.length || 20 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-[22px] h-[4px] rounded-full transition-colors ${
                      idx <= currentQIndex ? 'bg-[#E8A317]' : 'bg-[#1C2A3D]'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-[13px] font-medium text-[#A9B4C2]">
                PIN <span className="text-[#E8A317] font-semibold">{pinCode}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-9 h-9 rounded-lg border border-[#1C2A3D] flex items-center justify-center text-[#A9B4C2] hover:text-white transition cursor-pointer"
            title={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#E8A317]" /> : <VolumeX className="w-4 h-4 text-[#5B6675]" />}
          </button>

          {/* Emulated Mobile View Button */}
          <button
            onClick={() => setShowPlayerModal(true)}
            className="h-9 px-3.5 rounded-lg border border-[#2A3B52] hover:bg-[#13233A] text-xs font-medium text-[#E6EBF1] flex items-center gap-2 cursor-pointer transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#E8A317]" />
            <span>{myPlayer ? myPlayer.name : 'Rejoindre comme joueur'}</span>
          </button>

          {/* Close / Quit Session */}
          {onClose && (
            <button
              onClick={() => {
                if (stage !== 'lobby' && !window.confirm('Voulez-vous vraiment quitter la session Kahoot en cours ?')) return;
                onClose();
              }}
              className="h-9 px-3.5 rounded-lg text-xs font-medium text-[#A9B4C2] hover:text-white hover:bg-[#13233A] transition cursor-pointer"
            >
              Quitter
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0B1422]">
        
        {/* ----------------------------------------------------------------------- */}
        {/* STAGE 1 : LOBBY & QR CODE (Screen 3a)                                     */}
        {/* ----------------------------------------------------------------------- */}
        {stage === 'lobby' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] min-h-0 bg-[#0B1422] text-[#E6EBF1] overflow-hidden">
            
            {/* Left : QR Code & Join Steps */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 lg:gap-14 p-8 lg:p-12 overflow-y-auto">
              
              {/* QR Code Container */}
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3.5 shadow-2xl shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Kahoot Live" className="w-56 h-56 rounded-lg" />
                ) : (
                  <div className="w-56 h-56 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Génération QR Code...
                  </div>
                )}
                <span className="font-mono text-xs font-medium text-[#5B6675]">
                  viblab.ocpms.com/live
                </span>
              </div>

              {/* Instructions & Big PIN */}
              <div className="flex flex-col gap-5 max-w-[440px]">
                <span className="font-mono text-xs font-semibold tracking-[0.14em] text-[#E8A317] uppercase">
                  REJOINDRE LA PARTIE
                </span>
                
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white tracking-[-0.03em] leading-[1.08]">
                  Sortez vos smartphones
                </h1>

                <div className="flex flex-col gap-3.5 pt-1">
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono text-xs font-semibold text-[#E8A317] shrink-0">01</span>
                    <span className="text-sm sm:text-base text-[#C8D3DF] leading-snug">
                      Scannez le QR code avec l'appareil photo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono text-xs font-semibold text-[#E8A317] shrink-0">02</span>
                    <span className="text-sm sm:text-base text-[#C8D3DF] leading-snug">
                      Ou saisissez le code PIN sur <span className="text-white font-medium">viblab.ocpms.com/live</span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono text-xs font-semibold text-[#E8A317] shrink-0">03</span>
                    <span className="text-sm sm:text-base text-[#C8D3DF] leading-snug">
                      Entrez votre nom ou celui de votre équipe
                    </span>
                  </div>
                </div>

                {/* Big PIN Box */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#111D2E] border border-[#1C2A3D] shadow-lg mt-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#7F8B9A]">
                      CODE PIN
                    </span>
                    <span className="font-mono text-3xl sm:text-4xl font-semibold tracking-[0.1em] text-[#E8A317] leading-none mt-1">
                      {pinCode}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(joinUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[#2A3B52] hover:bg-[#1C2A3D] text-xs font-medium text-[#E6EBF1] transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copié !' : 'Copier le lien'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar : Configuration & Players List (Screen 3a) */}
            <div className="bg-[#0E1828] border-t lg:border-t-0 lg:border-l border-[#1C2A3D] p-6 flex flex-col justify-between gap-5 overflow-y-auto">
              
              <div className="flex flex-col gap-4">
                {/* Scope selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#7F8B9A] uppercase">
                    PÉRIMÈTRE
                  </span>
                  <div className="relative">
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                      className="w-full h-[42px] px-3 rounded-lg bg-[#111D2E] border border-[#2A3B52] text-xs font-medium text-white outline-none cursor-pointer appearance-none pr-8"
                    >
                      <option value={0}>
                        Grand Kahoot général · Modules 1 à 7
                      </option>
                      {modules.map(m => {
                        const kahootCount = m.qs.filter(q => q.inKahoot === true).length;
                        return (
                          <option key={m.id} value={m.id}>
                            Module {m.id} · {m.title} {kahootCount > 0 ? `(${kahootCount} Qs Kahoot)` : `(${m.qs.length} Qs)`}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronRight className="w-4 h-4 text-[#7F8B9A] absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Kahoot Question Manager Button */}
                <button
                  type="button"
                  onClick={() => setShowQuestionPicker(true)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#111D2E] hover:bg-[#16273D] border border-[#2A3B52] hover:border-[#E8A317] text-xs font-semibold text-[#E6EBF1] flex items-center justify-between transition cursor-pointer shadow-sm group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base group-hover:scale-110 transition-transform">🎯</span>
                    <span className="text-white">Sélectionner les questions ({activeKahootCount} active{activeKahootCount > 1 ? 's' : ''})</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#E8A317] bg-[#E8A317]/15 px-2 py-0.5 rounded border border-[#E8A317]/30">
                    Choisir ❯
                  </span>
                </button>

                {/* 3 Metrics: Questions, Complexité, Chrono */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#7F8B9A]">Questions</span>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="h-[38px] px-2.5 rounded-lg bg-[#111D2E] border border-[#2A3B52] text-xs font-medium text-white outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
                      <option value={30}>30</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#7F8B9A]">Complexité</span>
                    <select
                      value={complexityFilter}
                      onChange={(e) => setComplexityFilter(e.target.value as any)}
                      className="h-[38px] px-2.5 rounded-lg bg-[#111D2E] border border-[#2A3B52] text-xs font-medium text-white outline-none"
                    >
                      <option value="all">Mixte</option>
                      <option value="traps_only">Pièges</option>
                      <option value="fundamentals">Direct</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#7F8B9A]">Chrono</span>
                    <select
                      value={timePerQuestion}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTimePerQuestion(val);
                        setTimeLeft(val);
                      }}
                      className="h-[38px] px-2.5 rounded-lg bg-[#111D2E] border border-[#2A3B52] text-xs font-medium text-white outline-none"
                    >
                      <option value={15}>15 s</option>
                      <option value={20}>20 s</option>
                      <option value={30}>30 s</option>
                      <option value={45}>45 s</option>
                      <option value={60}>60 s</option>
                    </select>
                  </div>
                </div>

                {/* Trainer Random Mode Switch (Le Formateur a la main : Aléatoire vs Séquentiel) */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#7F8B9A] font-medium">Ordre des questions</span>
                    <span className="font-mono text-[10px] text-[#E8A317] font-semibold">
                      {isRandomOrder ? 'Aléatoire 🔀' : 'Séquentiel 🔢'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRandomOrder(true)}
                      className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isRandomOrder
                          ? 'bg-[#E8A317]/20 border-[#E8A317] text-[#E8A317]'
                          : 'bg-[#111D2E] border-[#2A3B52] text-[#A9B4C2] hover:text-white hover:border-[#3D526E]'
                      }`}
                      title="Mélange aléatoire des questions de la session"
                    >
                      <span>🔀</span>
                      <span>Aléatoire</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRandomOrder(false)}
                      className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        !isRandomOrder
                          ? 'bg-[#E8A317]/20 border-[#E8A317] text-[#E8A317]'
                          : 'bg-[#111D2E] border-[#2A3B52] text-[#A9B4C2] hover:text-white hover:border-[#3D526E]'
                      }`}
                      title="Suit l'ordre séquentiel défini par l'administrateur"
                    >
                      <span>🔢</span>
                      <span>Séquentiel</span>
                    </button>
                  </div>
                </div>

                {/* Auto advance toggle */}
                <div 
                  onClick={() => setAutoAdvanceOnAllAnswered(!autoAdvanceOnAllAnswered)}
                  className="flex items-center gap-3 pt-1 cursor-pointer select-none"
                >
                  <div className={`w-[32px] h-[18px] rounded-full transition-colors relative ${
                    autoAdvanceOnAllAnswered ? 'bg-[#E8A317]' : 'bg-[#1C2A3D]'
                  }`}>
                    <span className={`w-3.5 h-3.5 rounded-full bg-[#0B1422] absolute top-[2px] transition-transform ${
                      autoAdvanceOnAllAnswered ? 'right-[2px]' : 'left-[2px]'
                    }`} />
                  </div>
                  <span className="text-xs text-[#C8D3DF]">
                    Passer dès que tous ont répondu
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#1C2A3D]" />

                {/* Connected Participants Section */}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-white">Participants</span>
                  <span className="font-mono text-xs text-[#7F8B9A]">
                    {players.length} connecté{players.length > 1 ? 's' : ''}
                  </span>
                </div>

                {players.length === 0 ? (
                  <div className="border border-dashed border-[#2A3B52] rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex gap-1.5 py-1">
                      <span className="w-2 h-2 rounded-full bg-[#E8A317]" />
                      <span className="w-2 h-2 rounded-full bg-[#7A5A1E]" />
                      <span className="w-2 h-2 rounded-full bg-[#3A3420]" />
                    </div>
                    <span className="text-sm font-medium text-[#E6EBF1]">
                      En attente des joueurs
                    </span>
                    <span className="text-xs text-[#7F8B9A] max-w-[240px] leading-relaxed">
                      Les noms apparaissent ici dès qu'un joueur rejoint la partie.
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSampleBots}
                      className="text-xs font-semibold text-[#E8A317] hover:underline cursor-pointer mt-1"
                    >
                      Ajouter des équipes de test
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {players.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-[#111D2E] border border-[#1C2A3D]"
                        >
                          <span className="text-lg">{p.avatar}</span>
                          <div className="overflow-hidden text-left">
                            <div className="font-semibold text-xs text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-[#7F8B9A] font-mono">
                              {p.isBot ? 'Équipe test' : 'Connecté'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddSampleBots}
                        className="text-xs font-medium text-[#E8A317] hover:underline cursor-pointer"
                      >
                        + Ajouter d'autres équipes de test
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Start Button */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleStartSession}
                  disabled={players.length === 0}
                  className={`h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    players.length > 0
                      ? 'bg-[#E8A317] hover:bg-[#D97706] text-[#0B1422] shadow-md'
                      : 'bg-[#1C2A3D] text-[#5E6B7C] cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Démarrer · {questionCount} questions · {timePerQuestion} s</span>
                </button>
                <span className="text-[11px] text-[#7F8B9A] text-center">
                  Disponible dès le premier joueur connecté
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE 2 : COUNTDOWN (3-2-1)                                               */}
        {/* ----------------------------------------------------------------------- */}
        {stage === 'countdown' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0B1422]">
            <div className="font-mono text-xs font-semibold tracking-wider text-[#A9B4C2] mb-3 uppercase">
              QUESTION {currentQIndex + 1} / {sessionQuestions.length || questionCount}
            </div>
            <div className="font-mono text-8xl lg:text-9xl font-bold text-[#E8A317] animate-bounce">
              {countdownNum}
            </div>
            <div className="text-sm font-medium text-[#7F8B9A] mt-6">
              Préparez-vous à répondre rapidement !
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE 3 : ACTIVE QUESTION (Screen 3b)                                     */}
        {/* ----------------------------------------------------------------------- */}
        {stage === 'question' && currentQ && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:px-28 min-h-0 bg-[#0B1422] text-[#E6EBF1] max-w-[1300px] mx-auto w-full">
            
            {/* Header row: Question index + Module pill + Countdown timer + Skip button */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-semibold tracking-[0.08em] text-[#A9B4C2]">
                QUESTION <span className="text-white">{String(currentQIndex + 1).padStart(2, '0')}</span> / {sessionQuestions.length}
              </span>
              
              <span className="text-xs font-medium text-[#A9B4C2] px-2.5 py-1 rounded border border-[#2A3B52]">
                {activeModule?.title || 'Formation vibratoire'}
              </span>

              {currentQ.isTrap && (
                <span className="text-xs font-medium text-[#E8A317] px-2.5 py-1 rounded bg-[#E8A317]/15 border border-[#E8A317]/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Piège de terrain
                </span>
              )}

              {/* Multiple choice indicator badge */}
              {Boolean(currentQ.type === 'multi' || Array.isArray(currentQ.a)) && (
                <span className="text-xs font-semibold text-[#38BDF8] px-2.5 py-1 rounded bg-[#0284C7]/15 border border-[#38BDF8]/40 flex items-center gap-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Choix multiple ({Array.isArray(currentQ.a) ? `${currentQ.a.length} réponses` : 'plusieurs réponses'})</span>
                </span>
              )}

              {/* Abacus indicator / launch button if question requires an abacus */}
              {currentQ.tool && (
                <button
                  type="button"
                  onClick={() => setShowTrainerAbacus(true)}
                  className="h-8 px-3 rounded-lg bg-[#E8A317]/20 hover:bg-[#E8A317]/30 border border-[#E8A317]/50 text-xs font-bold text-[#E8A317] flex items-center gap-1.5 transition cursor-pointer shadow-sm animate-pulse"
                  title="Ouvrir l'abaque de calcul nécessaire pour cette question"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Abaque : {TOOLS_LABELS[normalizeTool(currentQ.tool)] || 'Calculateur'}</span>
                </button>
              )}

              <div className="flex-1" />

              {/* Circular Monospace Countdown Timer */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] flex items-center justify-center font-mono font-semibold text-xl sm:text-2xl transition-colors ${
                timeLeft <= 5 
                  ? 'border-red-500 text-red-400 animate-pulse' 
                  : 'border-[#E8A317] text-white'
              }`}>
                {timeLeft}
              </div>

              {/* Next / Reveal button */}
              <button
                onClick={handleRevealResult}
                className="h-9 px-3.5 rounded-lg border border-[#2A3B52] hover:bg-[#13233A] text-xs font-medium text-[#E6EBF1] flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Afficher le résultat</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Central Question Headline & Optional Photo */}
            <div className="flex-1 flex flex-col items-center justify-center my-4 px-4 gap-4">
              <h2 className="text-xl sm:text-2xl lg:text-[32px] font-semibold text-white text-center leading-[1.3] max-w-[1000px] tracking-[-0.015em]">
                {currentQ.t}
              </h2>

              {Boolean(currentQ.type === 'multi' || Array.isArray(currentQ.a)) && (
                <div className="px-3.5 py-1 rounded-full bg-[#0284C7]/20 border border-[#38BDF8]/40 text-[#7DD3FC] text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                  <span>Question à choix multiple : sélectionnez toutes les réponses valides sur votre mobile</span>
                </div>
              )}

              {(currentQ.image || currentQ.imageUrl) && (
                <div 
                  onClick={() => setZoomImage(currentQ.image || currentQ.imageUrl || null)}
                  className="relative group cursor-pointer max-h-52 sm:max-h-64 rounded-xl overflow-hidden border border-[#2A3B52] bg-[#0E1828] shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <img 
                    src={currentQ.image || currentQ.imageUrl} 
                    alt="Illustration question" 
                    className="max-h-52 sm:max-h-64 w-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                    <Maximize2 className="w-4 h-4" />
                    <span>Agrandir l'image</span>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Cards (Screen 3b) */}
            <div className={`grid gap-3 sm:gap-3.5 ${(currentQ.o?.length || 4) <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto w-full' : 'grid-cols-1 md:grid-cols-2'}`}>
              {(currentQ.o && currentQ.o.length > 0 ? currentQ.o : ['Option A', 'Option B']).map((opt, idx) => {
                const tile = KAHOOT_TILES[idx % KAHOOT_TILES.length];
                return (
                  <div
                    key={idx}
                    className={`h-[76px] sm:h-[84px] px-5 sm:px-6 rounded-xl ${tile.bg} flex items-center gap-4 text-white shadow-lg transition-transform`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-xl font-bold shrink-0">
                      {tile.shape}
                    </div>
                    <span className="text-base sm:text-lg font-semibold leading-tight line-clamp-2">
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Progress Bar: Responses received */}
            <div className="flex items-center gap-3.5 pt-6 text-xs text-[#A9B4C2]">
              <span className="shrink-0 font-medium">Réponses reçues</span>
              <div className="flex-1 h-1.5 rounded-full bg-[#1C2A3D] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#E8A317] transition-all duration-300"
                  style={{
                    width: `${players.length > 0 ? (players.filter(p => p.answeredCurrent).length / players.length) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="font-mono text-xs font-semibold text-white shrink-0">
                {players.filter(p => p.answeredCurrent).length} / {players.length}
              </span>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE 4 : REVEAL & EXPLANATION (Screen 3c)                                */}
        {/* ----------------------------------------------------------------------- */}
        {stage === 'reveal' && currentQ && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:px-28 min-h-0 bg-[#0B1422] text-[#E6EBF1] max-w-[1300px] mx-auto w-full overflow-y-auto">
            
            {/* Header row */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-semibold tracking-[0.08em] text-[#A9B4C2]">
                QUESTION <span className="text-white">{String(currentQIndex + 1).padStart(2, '0')}</span> / {sessionQuestions.length}
              </span>

              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6FD3A0] px-2.5 py-1 rounded bg-[#11301F]">
                <Check className="w-3.5 h-3.5" />
                Résultat
              </span>

              <div className="flex-1" />

              {/* Correct answers summary stats */}
              {(() => {
                const correctCount = players.filter(p => isPlayerCorrect(p, currentQ)).length;
                const pct = players.length > 0 ? Math.round((correctCount / players.length) * 100) : 0;
                return (
                  <span className="font-mono text-xs font-medium text-[#A9B4C2]">
                    {correctCount} / {players.length} bonnes réponses · {pct} %
                  </span>
                );
              })()}
            </div>

            {/* Question prompt & Abacus reminder */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-white max-w-[950px] leading-[1.35] tracking-[-0.01em]">
                {currentQ.t}
              </h2>

              {currentQ.tool && (
                <button
                  type="button"
                  onClick={() => setShowTrainerAbacus(true)}
                  className="self-start sm:self-auto shrink-0 h-8 px-3 rounded-lg bg-[#E8A317]/20 hover:bg-[#E8A317]/30 border border-[#E8A317]/50 text-xs font-bold text-[#E8A317] flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Consulter l'abaque de calcul"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Abaque : {TOOLS_LABELS[normalizeTool(currentQ.tool)] || 'Calculateur'}</span>
                </button>
              )}
            </div>

            {/* Optional Photo in Reveal */}
            {(currentQ.image || currentQ.imageUrl) && (
              <div className="mb-3 flex items-center gap-3">
                <div 
                  onClick={() => setZoomImage(currentQ.image || currentQ.imageUrl || null)}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-[#2A3B52] bg-[#0E1828] shadow max-h-32"
                >
                  <img
                    src={currentQ.image || currentQ.imageUrl}
                    alt="Illustration question"
                    className="max-h-32 object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[11px] font-medium">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Agrandir</span>
                  </div>
                </div>
                <span className="text-xs text-[#7F8B9A] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Graphique / Schéma associé
                </span>
              </div>
            )}

            {/* Result Rows (Screen 3c) */}
            <div className="flex flex-col gap-2.5 my-2">
              {(currentQ.o || []).map((opt, idx) => {
                const isCorrect = Array.isArray(currentQ.a)
                  ? currentQ.a.includes(idx)
                  : (currentQ.a === idx);
                const voteCount = answerDistribution[idx] || 0;
                const votePct = players.length > 0 ? Math.round((voteCount / players.length) * 100) : 0;
                const tile = KAHOOT_TILES[idx % KAHOOT_TILES.length];

                return isCorrect ? (
                  /* Correct Answer Row */
                  <div
                    key={idx}
                    className="grid grid-cols-[36px_minmax(0,1fr)_120px] gap-4 items-center h-[56px] sm:h-[60px] px-4 rounded-xl bg-[#123224] border-[1.5px] border-[#2E9E6A] shadow-md"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#2E9E6A] flex items-center justify-center text-white shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>

                    <div className="relative h-9 flex items-center overflow-hidden rounded">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#2E9E6A]/20 rounded transition-all duration-500" 
                        style={{ width: `${votePct}%` }}
                      />
                      <span className="relative pl-3 text-sm sm:text-base font-semibold text-white truncate">
                        {opt}
                      </span>
                    </div>

                    <span className="font-mono text-xs sm:text-sm font-semibold text-white text-right">
                      {voteCount} vote{voteCount > 1 ? 's' : ''} ({votePct}%)
                    </span>
                  </div>
                ) : (
                  /* Other Answer Rows */
                  <div
                    key={idx}
                    className="grid grid-cols-[36px_minmax(0,1fr)_120px] gap-4 items-center h-[56px] sm:h-[60px] px-4 rounded-xl bg-[#0F1A2A] border border-[#1C2A3D]"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#1C2A3D] flex items-center justify-center text-[#7F8B9A] font-bold shrink-0">
                      {tile.shape}
                    </div>

                    <div className="relative h-9 flex items-center overflow-hidden rounded">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-[#1C2A3D]/40 rounded transition-all duration-500" 
                        style={{ width: `${votePct}%` }}
                      />
                      <span className="relative pl-3 text-sm sm:text-base font-medium text-[#8A97A8] truncate">
                        {opt}
                      </span>
                    </div>

                    <span className="font-mono text-xs sm:text-sm font-medium text-[#7F8B9A] text-right">
                      {voteCount} vote{voteCount > 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pedagogical Explanation Box (Screen 3c) */}
            <div className="flex flex-col gap-2 p-4 sm:p-5 rounded-xl bg-[#111D2E] border border-[#1C2A3D] my-2">
              <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#E8A317] uppercase">
                EXPLICATION
              </span>
              
              {currentQ.isTrap && currentQ.trapWarning && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#E8A317]/10 border border-[#E8A317]/20 text-xs text-[#E8A317]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Piège terrain : </strong>
                    <span>{currentQ.trapWarning}</span>
                  </div>
                </div>
              )}

              <p className="text-sm sm:text-base text-[#D5DDE6] leading-relaxed m-0">
                {currentQ.e || "Le diagnostic vibratoire relève de la conformité aux critères ISO 18436-2."}
              </p>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={handleNextQuestionOrPodium}
                className="h-10 sm:h-11 px-4 rounded-lg border border-[#2A3B52] hover:bg-[#13233A] text-xs sm:text-sm font-medium text-[#E6EBF1] transition cursor-pointer"
              >
                Question suivante
              </button>

              <button
                onClick={handleGoToLeaderboard}
                className="h-10 sm:h-11 px-5 rounded-lg bg-[#E8A317] hover:bg-[#D97706] text-[#0B1422] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>Afficher le classement</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE 5 : LEADERBOARD                                                     */}
        {/* ----------------------------------------------------------------------- */}
        {stage === 'leaderboard' && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-4xl w-full mx-auto overflow-y-auto">
            
            <div className="flex flex-col gap-1 text-center mb-6">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#E8A317] uppercase">
                CLASSEMENT EN DIRECT
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Tableau des scores
              </h2>
              <span className="font-mono text-xs text-[#7F8B9A]">
                Après la question {currentQIndex + 1} / {sessionQuestions.length}
              </span>
            </div>

            {/* Top ranked cards */}
            <div className="flex flex-col gap-3 my-auto">
              {rankedPlayers.slice(0, 5).map((player, idx) => {
                const isFirst = idx === 0;
                return (
                  <div
                    key={player.id}
                    className={`h-[68px] px-5 rounded-xl border flex items-center justify-between transition-all ${
                      isFirst
                        ? 'bg-[#111D2E] border-[#E8A317] shadow-lg'
                        : 'bg-[#0E1828] border-[#1C2A3D]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        isFirst ? 'bg-[#E8A317] text-[#0B1422]' : 'bg-[#1C2A3D] text-[#A9B4C2]'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-2xl">{player.avatar}</span>
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-semibold text-white">
                          {player.name}
                        </span>
                        {player.lastScoreGain > 0 && (
                          <span className="font-mono text-[11px] text-[#6FD3A0]">
                            +{player.lastScoreGain} pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="font-mono text-lg sm:text-xl font-bold text-[#E8A317]">
                      {player.score.toLocaleString()} <span className="text-xs text-[#7F8B9A] font-normal">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-[#1C2A3D] mt-6">
              <span className="font-mono text-xs text-[#7F8B9A]">
                Question suivante : {currentQIndex + 2} / {sessionQuestions.length}
              </span>

              <button
                onClick={handleNextQuestionOrPodium}
                className="h-10 sm:h-11 px-5 rounded-lg bg-[#E8A317] hover:bg-[#D97706] text-[#0B1422] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>{currentQIndex + 1 >= sessionQuestions.length ? 'Voir le podium final 🏆' : 'Question suivante →'}</span>
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE 6 : FINAL PODIUM                                                    */}
        {/* ----------------------------------------------------------------------- */}
        {stage === 'podium' && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 max-w-5xl w-full mx-auto overflow-y-auto">
            
            <div className="flex flex-col gap-1 text-center mb-6">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#E8A317] uppercase">
                PODIUM FINAL
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Félicitations aux Vainqueurs !
              </h1>
              <p className="text-xs sm:text-sm text-[#7F8B9A]">
                Session terminée avec succès sur le diagnostic prédictif VibLab.
              </p>
            </div>

            {/* Podium Display */}
            <div className="flex items-end justify-center gap-3 sm:gap-6 my-auto pt-6 pb-4">
              
              {/* 2nd Place (Silver) */}
              {rankedPlayers[1] && (
                <div className="flex flex-col items-center flex-1 max-w-[200px]">
                  <span className="text-3xl sm:text-4xl mb-2">{rankedPlayers[1].avatar}</span>
                  <div className="font-semibold text-xs sm:text-sm text-slate-200 text-center truncate w-full mb-1">
                    {rankedPlayers[1].name}
                  </div>
                  <div className="font-mono text-xs text-[#7F8B9A] mb-2">
                    {rankedPlayers[1].score.toLocaleString()} pts
                  </div>
                  <div className="w-full h-40 rounded-t-2xl bg-[#1C2A3D] border-t-2 border-[#94A3B8] flex flex-col items-center justify-start pt-3">
                    <span className="font-mono font-bold text-3xl text-white">2</span>
                    <span className="font-mono text-[10px] text-[#94A3B8] uppercase mt-1">2ème Place</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {rankedPlayers[0] && (
                <div className="flex flex-col items-center flex-1 max-w-[240px] z-10">
                  <div className="text-3xl mb-1">👑</div>
                  <span className="text-4xl sm:text-5xl mb-2">{rankedPlayers[0].avatar}</span>
                  <div className="font-bold text-sm sm:text-base text-[#E8A317] text-center truncate w-full mb-1">
                    {rankedPlayers[0].name}
                  </div>
                  <div className="font-mono font-bold text-sm text-[#E8A317] mb-2">
                    {rankedPlayers[0].score.toLocaleString()} pts
                  </div>
                  <div className="w-full h-52 rounded-t-2xl bg-[#E8A317] flex flex-col items-center justify-start pt-3 shadow-2xl">
                    <Trophy className="w-6 h-6 text-[#0B1422] mb-1" />
                    <span className="font-mono font-bold text-4xl text-[#0B1422]">1</span>
                    <span className="font-mono text-xs font-bold text-[#0B1422] uppercase mt-1">Vainqueur !</span>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {rankedPlayers[2] && (
                <div className="flex flex-col items-center flex-1 max-w-[200px]">
                  <span className="text-3xl sm:text-4xl mb-2">{rankedPlayers[2].avatar}</span>
                  <div className="font-semibold text-xs sm:text-sm text-slate-200 text-center truncate w-full mb-1">
                    {rankedPlayers[2].name}
                  </div>
                  <div className="font-mono text-xs text-[#7F8B9A] mb-2">
                    {rankedPlayers[2].score.toLocaleString()} pts
                  </div>
                  <div className="w-full h-32 rounded-t-2xl bg-[#111D2E] border-t-2 border-[#B45309] flex flex-col items-center justify-start pt-3">
                    <span className="font-mono font-bold text-3xl text-white">3</span>
                    <span className="font-mono text-[10px] text-[#B45309] uppercase mt-1">3ème Place</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-[#1C2A3D]">
              <button
                onClick={() => {
                  setStage('lobby');
                  setPlayers([]);
                }}
                className="h-10 px-4 rounded-lg border border-[#2A3B52] hover:bg-[#13233A] text-xs font-medium text-[#E6EBF1] flex items-center gap-2 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nouvelle Session Live</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="h-10 px-5 rounded-lg bg-[#0F1B2D] hover:bg-[#1C2E47] border border-[#2A3B52] text-white text-xs font-semibold cursor-pointer shadow-md transition"
                >
                  Quitter le Mode Kahoot
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MOBILE PLAYER CONTROLLER MODAL (VibLab Industrial Style)                   */}
      {/* ========================================================================= */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1422] border border-[#1C2A3D] shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <button
              onClick={() => setShowPlayerModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-[#13233A] text-[#8A929C] hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center pb-4 border-b border-[#1C2A3D]">
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#E8A317] uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Manette de Réponse Joueur</span>
              </div>
              <h3 className="text-base font-semibold text-white mt-1">
                {myPlayer ? myPlayer.name : 'Rejoindre la Session'}
              </h3>
            </div>

            {/* Registration Form */}
            {!myPlayer ? (
              <form onSubmit={handleJoinMyself} className="space-y-4 py-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A9B4C2]">
                    Votre Nom ou Nom d'équipe :
                  </label>
                  <input
                    type="text"
                    value={myPlayerNameInput}
                    onChange={(e) => setMyPlayerNameInput(e.target.value)}
                    placeholder="Ex: Équipe Rotor 1 ou Mohamed"
                    className="h-10 px-3 rounded-lg bg-[#111D2E] border border-[#2A3B52] text-white text-xs font-medium outline-none focus:border-[#E8A317]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A9B4C2]">
                    Choisissez votre avatar :
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['⚡', '⚙️', '🚀', '🔬', '🏭', '🦁', '🦅', '🏎️'].map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setMyPlayerAvatar(av)}
                        className={`h-11 rounded-lg text-xl border transition cursor-pointer ${
                          myPlayerAvatar === av
                            ? 'bg-[#13233A] border-[#E8A317]'
                            : 'bg-[#111D2E] border-[#1C2A3D] hover:bg-[#13233A]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-10 rounded-lg font-semibold text-xs bg-[#E8A317] hover:bg-[#D97706] text-[#0B1422] shadow-md cursor-pointer transition mt-2"
                >
                  Entrer dans la partie !
                </button>
              </form>
            ) : (
              /* Controller Gameplay View */
              <div className="flex-1 flex flex-col justify-between py-4 space-y-4">
                
                {/* Score & Status Banner */}
                <div className="p-3 rounded-xl bg-[#111D2E] border border-[#1C2A3D] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{myPlayer.avatar}</span>
                    <span className="font-semibold text-white">{myPlayer.name}</span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#E8A317]">
                    {myPlayer.score.toLocaleString()} pts
                  </div>
                </div>

                {stage === 'lobby' && (
                  <div className="text-center py-10 space-y-2">
                    <div className="text-3xl animate-bounce">⏳</div>
                    <div className="font-semibold text-sm text-white">Vous êtes prêt !</div>
                    <p className="text-xs text-[#7F8B9A]">
                      Attendez que le formateur démarre la session...
                    </p>
                  </div>
                )}

                {stage === 'countdown' && (
                  <div className="text-center py-8 space-y-2">
                    <div className="font-mono text-xs font-semibold text-[#A9B4C2] uppercase">
                      Question {currentQIndex + 1} / {sessionQuestions.length || questionCount}
                    </div>
                    <div className="text-6xl font-mono font-bold text-[#E8A317] animate-bounce">
                      {countdownNum}
                    </div>
                  </div>
                )}

                {stage === 'question' && (
                  <div className="space-y-3">
                    {/* Question Summary */}
                    {currentQ && (
                      <div className="p-3 rounded-xl bg-[#111D2E] border border-[#1C2A3D] text-center space-y-2">
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#A9B4C2]">
                          <span>Q {currentQIndex + 1} / {sessionQuestions.length}</span>
                          <span className={`font-semibold ${timeLeft <= 5 ? 'text-red-400' : 'text-[#E8A317]'}`}>
                            ⏱️ {timeLeft}s
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white line-clamp-3">
                          {currentQ.t}
                        </div>

                        {/* Optional Student Photo */}
                        {(currentQ.image || currentQ.imageUrl) && (
                          <div 
                            onClick={() => setZoomImage(currentQ.image || currentQ.imageUrl || null)}
                            className="relative rounded-lg overflow-hidden border border-[#2A3B52] max-h-32 flex items-center justify-center bg-black/40 cursor-pointer"
                          >
                            <img 
                              src={currentQ.image || currentQ.imageUrl} 
                              alt="Illustration" 
                              className="max-h-32 w-full object-contain"
                            />
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white flex items-center gap-1">
                              <Maximize2 className="w-2.5 h-2.5" />
                              <span>Zoom</span>
                            </div>
                          </div>
                        )}

                        {/* Student Abacus Button if required */}
                        {currentQ.tool && (
                          <button
                            type="button"
                            onClick={() => setShowStudentAbacus(true)}
                            className="w-full py-2 px-3 rounded-lg bg-[#E8A317]/20 hover:bg-[#E8A317]/30 border border-[#E8A317]/50 text-xs font-bold text-[#E8A317] flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            <Calculator className="w-4 h-4" />
                            <span>📊 Ouvrir l'Abaque ({TOOLS_LABELS[normalizeTool(currentQ.tool)] || 'Calculateur'})</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Answer Status or Answer Buttons */}
                    {myPlayer.answeredCurrent ? (
                      <div className="p-4 rounded-xl bg-[#11301F] border border-[#2E9E6A] text-center space-y-1">
                        <Check className="w-6 h-6 mx-auto text-[#6FD3A0]" />
                        <div className="font-semibold text-xs text-[#6FD3A0]">Réponse transmise !</div>
                        <div className="text-[10px] text-[#A9B4C2]">
                          Enregistrée en <span className="font-mono font-bold text-white">{myPlayer.answerTimeSec || (timePerQuestion - timeLeft)}s</span>
                        </div>
                      </div>
                    ) : Boolean(currentQ && (currentQ.type === 'multi' || Array.isArray(currentQ.a))) ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-2.5 text-[11px] font-medium text-[#7DD3FC] bg-[#0284C7]/15 border border-[#38BDF8]/30 rounded-lg py-1.5">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>Choix multiple : cochez vos choix</span>
                          </span>
                          <span className="font-mono font-bold text-white bg-[#0284C7]/40 px-2 py-0.5 rounded">
                            {selectedChoices.length} choix
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {KAHOOT_TILES.slice(0, currentQ?.o?.length || 4).map((tile, idx) => {
                            const isSelected = selectedChoices.includes(idx);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedChoices(prev =>
                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                  );
                                  playSound('tick');
                                }}
                                className={`h-16 rounded-xl ${tile.bg} text-white flex flex-col items-center justify-center gap-1 shadow-md transition-all cursor-pointer relative ${
                                  isSelected 
                                    ? 'ring-4 ring-white ring-offset-2 ring-offset-[#0B1422] scale-[1.02] shadow-2xl brightness-110' 
                                    : 'opacity-85 hover:opacity-100'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-[#0B1422] flex items-center justify-center font-bold text-xs shadow">
                                    ✓
                                  </div>
                                )}
                                <span className="text-lg font-bold">{tile.shape}</span>
                                <span className="text-[10px] font-semibold uppercase">{tile.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePlayerSubmitAnswer(selectedChoices)}
                          disabled={selectedChoices.length === 0}
                          className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                            selectedChoices.length > 0
                              ? 'bg-[#E8A317] hover:bg-[#D97706] text-[#0B1422] shadow-[#E8A317]/25 active:scale-95'
                              : 'bg-[#1C2A3D] text-[#5E6B7C] cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Valider mes réponses ({selectedChoices.length})</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {KAHOOT_TILES.slice(0, currentQ?.o?.length || 4).map((tile, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePlayerSubmitAnswer([idx])}
                            className={`h-16 rounded-xl ${tile.bg} text-white flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition cursor-pointer`}
                          >
                            <span className="text-lg font-bold">{tile.shape}</span>
                            <span className="text-[10px] font-semibold uppercase">{tile.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(stage === 'reveal' || stage === 'leaderboard') && (
                  <div className="text-center py-4 space-y-2">
                    {myPlayer.lastScoreGain > 0 ? (
                      <div className="p-4 rounded-xl bg-[#11301F] border border-[#2E9E6A]">
                        <div className="text-3xl">🎉</div>
                        <div className="font-semibold text-sm text-white mt-1">Bonne réponse !</div>
                        <div className="font-mono text-lg font-bold text-[#6FD3A0] mt-0.5">
                          +{myPlayer.lastScoreGain} pts
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#2A1115] border border-red-500/40">
                        <div className="text-3xl">❌</div>
                        <div className="font-semibold text-sm text-white mt-1">
                          {Boolean(currentQ && (currentQ.type === 'multi' || Array.isArray(currentQ.a))) 
                            ? 'Combinaison incomplète ou incorrecte' 
                            : 'Mauvaise réponse'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stage === 'podium' && (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-4xl">🏆</div>
                    <div className="font-bold text-sm text-white">Session terminée !</div>
                    <div className="font-mono text-base font-semibold text-[#E8A317]">
                      Score final : {myPlayer.score.toLocaleString()} pts
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS : ABACUS (TRAINER & STUDENT) + IMAGE ZOOM                          */}
      {/* ========================================================================= */}

      {/* Trainer Abacus Modal */}
      {showTrainerAbacus && currentQ && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0E1828] border border-[#2A3B52] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1C2A3D] bg-[#111D2E]">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-[#E8A317]" />
                <span className="font-semibold text-sm text-white">
                  Abaque & Outil : {TOOLS_LABELS[normalizeTool(currentQ.tool)] || 'Calculateur ISO'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTrainerAbacus(false)}
                className="p-1.5 rounded-lg text-[#7F8B9A] hover:text-white hover:bg-[#1C2A3D] transition cursor-pointer"
                title="Fermer l'abaque"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <FormationCalc 
                initialTool={normalizeTool(currentQ.tool)} 
                theme={theme}
                onClose={() => setShowTrainerAbacus(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Student Abacus Modal */}
      {showStudentAbacus && currentQ && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[92vh] bg-[#0E1828] border border-[#2A3B52] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C2A3D] bg-[#111D2E]">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Calculator className="w-4 h-4 text-[#E8A317]" />
                <span>Abaque ({TOOLS_LABELS[normalizeTool(currentQ.tool)] || 'Calculateur'})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentAbacus(false)}
                className="p-1 rounded text-[#7F8B9A] hover:text-white hover:bg-[#1C2A3D] transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <FormationCalc 
                initialTool={normalizeTool(currentQ.tool)} 
                theme={theme}
                onClose={() => setShowStudentAbacus(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="Agrandissement"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* KAHOOT QUESTION PICKER MODAL (TRAINER LIVE SELECTION WITH AUTO-SAVE)       */}
      {/* ========================================================================= */}
      {showQuestionPicker && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0E1828] border border-[#2A3B52] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C2A3D] bg-[#111D2E]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8A317]/15 border border-[#E8A317]/30 flex items-center justify-center text-lg">
                  🎯
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>Sélection des questions pour le Kahoot Live</span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#E8A317] text-[#0B1422]">
                      {activeKahootCount} sélectionnée{activeKahootCount > 1 ? 's' : ''}
                    </span>
                  </h3>
                  <p className="text-xs text-[#7F8B9A] mt-0.5">
                    {selectedModuleId === 0 
                      ? 'Toutes les banques de questions (Modules 1 à 7)' 
                      : `Module ${selectedModuleId} · ${activeModule?.title || ''}`}
                    {' · Sauvegardé automatiquement'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestionPicker(false)}
                className="p-1.5 rounded-lg text-[#7F8B9A] hover:text-white hover:bg-[#1C2A3D] transition cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Filters Bar */}
            <div className="p-4 border-b border-[#1C2A3D] bg-[#0B1422]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7F8B9A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Rechercher une question ou mot-clé..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#111D2E] border border-[#2A3B52] text-xs text-white placeholder-[#5B6675] outline-none focus:border-[#E8A317]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-[#111D2E] p-1 rounded-lg border border-[#1C2A3D]">
                <button
                  type="button"
                  onClick={() => setPickerFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    pickerFilter === 'all'
                      ? 'bg-[#E8A317] text-[#0B1422] font-semibold'
                      : 'text-[#A9B4C2] hover:text-white'
                  }`}
                >
                  Toutes
                </button>
                <button
                  type="button"
                  onClick={() => setPickerFilter('selected')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    pickerFilter === 'selected'
                      ? 'bg-[#E8A317] text-[#0B1422] font-semibold'
                      : 'text-[#A9B4C2] hover:text-white'
                  }`}
                >
                  Sélectionnées ({activeKahootCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPickerFilter('traps')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    pickerFilter === 'traps'
                      ? 'bg-[#E8A317] text-[#0B1422] font-semibold'
                      : 'text-[#A9B4C2] hover:text-white'
                  }`}
                >
                  Pièges
                </button>
              </div>

              {/* Bulk Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBulkToggleKahoot(true)}
                  className="h-8 px-2.5 rounded-lg bg-[#111D2E] hover:bg-[#1C2A3D] border border-[#2A3B52] text-[11px] font-semibold text-[#6FD3A0] transition cursor-pointer"
                  title="Tout cocher pour le Kahoot"
                >
                  ✓ Tout cocher
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkToggleKahoot(false)}
                  className="h-8 px-2.5 rounded-lg bg-[#111D2E] hover:bg-[#1C2A3D] border border-[#2A3B52] text-[11px] font-semibold text-[#E5484D] transition cursor-pointer"
                  title="Tout décocher"
                >
                  ✗ Tout retirer
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkToggleKahoot(false, true)}
                  className="h-8 px-2.5 rounded-lg bg-[#E8A317]/15 hover:bg-[#E8A317]/25 border border-[#E8A317]/30 text-[11px] font-semibold text-[#E8A317] transition cursor-pointer"
                  title="Sélectionner uniquement les questions pièges"
                >
                  ⚡ Pièges
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(() => {
                const targetModules = selectedModuleId === 0 ? modules : modules.filter(m => m.id === selectedModuleId);
                const allScopeQuestions = targetModules.flatMap(m => 
                  m.qs
                    .map((q, idx) => ({ q, modId: m.id, modTitle: m.title, index: idx }))
                    .filter(item => (item.q.type === 'single' || item.q.type === 'multi') && Array.isArray(item.q.o) && item.q.o.length >= 2)
                );

                const filtered = allScopeQuestions.filter(item => {
                  if (pickerFilter === 'selected' && !item.q.inKahoot) return false;
                  if (pickerFilter === 'traps' && !item.q.isTrap) return false;
                  if (pickerSearch.trim()) {
                    const search = pickerSearch.toLowerCase();
                    const inTitle = item.q.t.toLowerCase().includes(search);
                    const inExp = (item.q.e || '').toLowerCase().includes(search);
                    if (!inTitle && !inExp) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-[#7F8B9A] text-xs space-y-2">
                      <div className="text-3xl">🔍</div>
                      <div>Aucune question ne correspond aux critères de recherche.</div>
                    </div>
                  );
                }

                return filtered.map(({ q, modId, modTitle, index }) => {
                  const isChecked = Boolean(q.inKahoot);
                  return (
                    <div
                      key={`${modId}_${index}_${q.t.slice(0, 20)}`}
                      onClick={() => handleToggleQuestionInKahoot(q.t, modId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-[#13233A] border-[#E8A317]/60 shadow-md'
                          : 'bg-[#0F1A2A] border-[#1C2A3D] hover:border-[#2A3B52] opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded bg-[#E8A317] text-[#0B1422] flex items-center justify-center font-bold text-xs shadow">
                            ✓
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-[#3A4B62] bg-[#111D2E] hover:border-[#E8A317]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {selectedModuleId === 0 && (
                            <span className="font-mono text-[10px] text-[#A9B4C2] bg-[#1C2A3D] px-2 py-0.5 rounded">
                              Mod {modId}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            q.type === 'multi' 
                              ? 'bg-[#0284C7]/20 text-[#38BDF8] border border-[#38BDF8]/30' 
                              : 'bg-[#1C2A3D] text-[#A9B4C2]'
                          }`}>
                            {q.type === 'multi' ? 'Choix multiple' : 'Choix unique'}
                          </span>
                          {q.isTrap && (
                            <span className="text-[10px] font-semibold text-[#E8A317] bg-[#E8A317]/15 border border-[#E8A317]/30 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Piège
                            </span>
                          )}
                          {q.tool && (
                            <span className="text-[10px] font-mono text-[#6FD3A0] bg-[#11301F] border border-[#2E9E6A]/40 px-2 py-0.5 rounded flex items-center gap-1">
                              <Calculator className="w-3 h-3" />
                              {TOOLS_LABELS[normalizeTool(q.tool)] || 'Abaque'}
                            </span>
                          )}
                          {(q.image || q.imageUrl) && (
                            <span className="text-[10px] text-[#C4B5FD] bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-2 py-0.5 rounded flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Photo
                            </span>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm font-medium text-white leading-snug">
                          {q.t}
                        </div>
                      </div>

                      {/* Badge status */}
                      <div className="shrink-0 pt-0.5">
                        <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full ${
                          isChecked
                            ? 'bg-[#E8A317]/20 text-[#E8A317] border border-[#E8A317]/40'
                            : 'text-[#5B6675]'
                        }`}>
                          {isChecked ? 'Dans Kahoot' : 'Non inclus'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer with summary and confirmation */}
            <div className="px-5 py-3.5 border-t border-[#1C2A3D] bg-[#111D2E] flex items-center justify-between">
              <span className="text-xs text-[#7F8B9A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Mémorisation instantanée · Conservée lors du rechargement de la page</span>
              </span>

              <button
                type="button"
                onClick={() => setShowQuestionPicker(false)}
                className="h-9 px-4 rounded-lg bg-[#E8A317] hover:bg-[#D97706] text-[#0B1422] font-semibold text-xs shadow-md transition cursor-pointer"
              >
                Terminer & Jouer ({activeKahootCount} questions)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
