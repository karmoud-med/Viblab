import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator, 
  X, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Settings, 
  Shuffle, 
  FileQuestion,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { 
  FormationModule, 
  FormationQuestion, 
  QuestionSingle, 
  QuestionMulti, 
  QuestionNum, 
  QuestionType, 
  ModuleConfig 
} from './formationData';
import { 
  loadFormationModules, 
  saveFormationModules, 
  loadModuleConfigs, 
  saveModuleConfigs, 
  resetFormationToDefault 
} from './formationStore';
import FormationCalc, { ToolType } from './formationCalc';

interface QuestionBankManagerProps {
  theme?: 'dark' | 'light' | 'mono';
  onClose?: () => void;
  currentUserRole?: string;
  initialModuleId?: number;
}

export default function QuestionBankManager({
  theme = 'light',
  onClose,
  currentUserRole = 'admin',
  initialModuleId = 1
}: QuestionBankManagerProps) {
  // Data state
  const [modules, setModules] = useState<FormationModule[]>(() => loadFormationModules());
  const [configs, setConfigs] = useState<Record<number, ModuleConfig>>(() => loadModuleConfigs());
  const [activeModuleId, setActiveModuleId] = useState<number>(initialModuleId);

  // Live synchronization with external store updates (e.g. from Kahoot Lobby)
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

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'multi' | 'num'>('all');
  const [trapFilter, setTrapFilter] = useState<'all' | 'trap_only' | 'standard_only'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'enabled_only' | 'disabled_only'>('all');
  const [kahootFilter, setKahootFilter] = useState<'all' | 'kahoot_only' | 'non_kahoot'>('all');

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Modal edit / add question state
  const [editingQuestion, setEditingQuestion] = useState<{
    moduleIndex: number;
    questionIndex: number | null; // null = add new
    data: FormationQuestion;
  } | null>(null);

  // Live calculator test preview drawer
  const [previewTool, setPreviewTool] = useState<{ type: ToolType; pre?: any } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const activeModuleIndex = useMemo(() => {
    const idx = modules.findIndex(m => m.id === activeModuleId);
    return idx >= 0 ? idx : 0;
  }, [modules, activeModuleId]);

  const activeModule = modules[activeModuleIndex] || modules[0];
  const activeConfig = configs[activeModuleId] || {
    id: activeModuleId,
    title: activeModule?.title || '',
    desc: activeModule?.desc || '',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
    kahootTimePerQuestion: 30,
    kahootQuestionCount: 20,
    kahootShuffle: true,
  };

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Update a single module config setting
  const handleUpdateConfig = <K extends keyof ModuleConfig>(key: K, value: ModuleConfig[K]) => {
    const updated = {
      ...configs,
      [activeModuleId]: {
        ...activeConfig,
        [key]: value
      }
    };
    setConfigs(updated);
    saveModuleConfigs(updated);
    showNotification('Règles du module enregistrées.');
  };

  // Filter questions based on active criteria
  const filteredQuestions = useMemo(() => {
    if (!activeModule?.qs) return [];
    return activeModule.qs.filter((q) => {
      if (visibilityFilter === 'enabled_only' && q.enabled === false) return false;
      if (visibilityFilter === 'disabled_only' && q.enabled !== false) return false;
      if (kahootFilter === 'kahoot_only' && !q.inKahoot) return false;
      if (kahootFilter === 'non_kahoot' && q.inKahoot) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (trapFilter === 'trap_only' && !q.isTrap) return false;
      if (trapFilter === 'standard_only' && q.isTrap) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const inTitle = q.t.toLowerCase().includes(term);
        const inExp = (q.e || '').toLowerCase().includes(term);
        const inTrap = (q.trapWarning || '').toLowerCase().includes(term);
        if (!inTitle && !inExp && !inTrap) return false;
      }
      return true;
    });
  }, [activeModule, visibilityFilter, kahootFilter, typeFilter, trapFilter, searchTerm]);

  // Statistics for active module
  const moduleStats = useMemo(() => {
    const qs = activeModule?.qs || [];
    const traps = qs.filter(q => q.isTrap).length;
    const num = qs.filter(q => q.type === 'num').length;
    const multi = qs.filter(q => q.type === 'multi').length;
    const single = qs.filter(q => q.type === 'single').length;
    const activeCount = qs.filter(q => q.enabled !== false).length;
    const disabledCount = qs.filter(q => q.enabled === false).length;
    const kahootCount = qs.filter(q => q.inKahoot === true).length;
    return { total: qs.length, traps, num, multi, single, activeCount, disabledCount, kahootCount };
  }, [activeModule]);

  // Toggle Kahoot inclusion for a single question
  const handleToggleQuestionKahoot = (index: number) => {
    const qs = [...activeModule.qs];
    const current = qs[index];
    const newInKahoot = !current.inKahoot;
    qs[index] = { ...current, inKahoot: newInKahoot };
    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification(
      newInKahoot
        ? `Question #${index + 1} incluse dans le Kahoot Live.`
        : `Question #${index + 1} retirée du Kahoot Live.`,
      newInKahoot ? 'success' : 'info'
    );
  };

  // Bulk Kahoot toggle for active module
  const handleToggleAllKahoot = (include: boolean) => {
    const qs = activeModule.qs.map(q => ({
      ...q,
      // Kahoot is intended for choice questions with options
      inKahoot: include && (q.type === 'single' || q.type === 'multi')
    }));
    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification(
      include
        ? `Toutes les questions QCM (${qs.filter(q => q.inKahoot).length}) sont incluses dans le Kahoot.`
        : `Toutes les questions sont retirées du Kahoot.`,
      include ? 'success' : 'info'
    );
  };

  // Auto-select essential traps & best questions for Kahoot (e.g. 15 questions)
  const handleAutoSelectKahoot = (targetCount: number = 15) => {
    let count = 0;
    const qs = activeModule.qs.map(q => {
      // First prioritize traps
      if (q.isTrap && q.type === 'single' && count < targetCount) {
        count++;
        return { ...q, inKahoot: true };
      }
      return { ...q, inKahoot: false };
    });

    // If still need more to reach targetCount, add standard single questions
    if (count < targetCount) {
      for (let i = 0; i < qs.length && count < targetCount; i++) {
        if (!qs[i].inKahoot && qs[i].type === 'single' && qs[i].enabled !== false) {
          qs[i].inKahoot = true;
          count++;
        }
      }
    }

    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification(`Sélection optimisée de ${count} questions pour le Kahoot Live !`, 'success');
  };

  // Toggle enabled/visible state of a single question
  const handleToggleQuestionEnabled = (index: number) => {
    const qs = [...activeModule.qs];
    const current = qs[index];
    const newEnabled = current.enabled === false ? true : false;
    qs[index] = { ...current, enabled: newEnabled };
    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification(
      newEnabled
        ? `Question #${index + 1} activée dans l'examen.`
        : `Question #${index + 1} masquée de l'examen (conservée en banque).`,
      newEnabled ? 'success' : 'info'
    );
  };

  // Bulk toggle for active module
  const handleToggleAllQuestions = (enable: boolean) => {
    const qs = activeModule.qs.map(q => ({ ...q, enabled: enable }));
    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification(
      enable
        ? `Toutes les questions (${qs.length}) sont actives.`
        : `Toutes les questions (${qs.length}) sont masquées de l'examen.`,
      enable ? 'success' : 'info'
    );
  };

  // Reorder question
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const qs = [...activeModule.qs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= qs.length) return;

    [qs[index], qs[targetIdx]] = [qs[targetIdx], qs[index]];
    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification('Ordre des questions mis à jour.');
  };

  // Duplicate question
  const handleDuplicateQuestion = (index: number) => {
    const orig = activeModule.qs[index];
    const clone = JSON.parse(JSON.stringify(orig)) as FormationQuestion;
    clone.t = `${clone.t} (Copie)`;
    const qs = [...activeModule.qs];
    qs.splice(index + 1, 0, clone);

    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification('Question dupliquée avec succès.');
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette question de la banque ?')) return;
    const qs = activeModule.qs.filter((_, i) => i !== index);
    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    showNotification('Question supprimée.', 'info');
  };

  // Save question from modal
  const handleSaveQuestionModal = (savedQ: FormationQuestion) => {
    if (!editingQuestion) return;
    const qs = [...activeModule.qs];
    if (editingQuestion.questionIndex === null) {
      qs.push(savedQ);
      showNotification('Nouvelle question ajoutée à la banque !');
    } else {
      qs[editingQuestion.questionIndex] = savedQ;
      showNotification('Question modifiée avec succès.');
    }

    const updatedModules = [...modules];
    updatedModules[activeModuleIndex] = { ...activeModule, qs };
    setModules(updatedModules);
    saveFormationModules(updatedModules);
    setEditingQuestion(null);
  };

  // Export question bank to JSON
  const handleExportJSON = () => {
    const bundle = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      modules,
      configs
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viblab_banque_questions_qcm_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Banque de questions exportée au format JSON.');
  };

  // Import question bank from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.modules && Array.isArray(parsed.modules)) {
          setModules(parsed.modules);
          saveFormationModules(parsed.modules);
          if (parsed.configs) {
            setConfigs(parsed.configs);
            saveModuleConfigs(parsed.configs);
          }
          showNotification(`Importation réussie : ${parsed.modules.length} modules chargés !`);
        } else {
          showNotification('Format de fichier JSON invalide.', 'error');
        }
      } catch (err) {
        showNotification('Erreur de lecture du fichier JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (!window.confirm('Voulez-vous réinitialiser toutes les questions aux questions officielles ISO 18436-2 ? Toute modification locale non exportée sera perdue.')) {
      return;
    }
    const res = resetFormationToDefault();
    setModules(res.modules);
    setConfigs(res.configs);
    showNotification('Banque de questions réinitialisée aux questions officielles !', 'info');
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[85vh] bg-white text-[#1C2733] rounded-xl border border-[#E3E1DA] overflow-hidden">
      
      {/* 1. TOP HEADER BANNER (VibLab Industrial Style) */}
      <div className="px-6 py-5 border-b border-[#E3E1DA] bg-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider">
              BANQUE DE QUESTIONS & PIÈGES · ISO 18436-2
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FDF6E7] text-[#7A4A00] border border-[#F1D699]">
              {currentUserRole === 'admin' ? 'Administration' : 'Formateur'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-[#0F1B2D] tracking-tight">
            Banque QCM & Pièges de Diagnostic
          </h2>
          <p className="text-[13px] text-[#5B6675] mt-0.5 max-w-2xl">
            Gestion du référentiel de questions d’examen, calibration des pièges terrain et règles de progression certifiante.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="h-[38px] px-3.5 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-[13px] font-medium flex items-center gap-2 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#5B6675]" />
            <span>Importer JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="h-[38px] px-3.5 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-[13px] font-medium flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5B6675]" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="h-[38px] px-3.5 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#FEE4E2]/40 text-[#B42318] text-[13px] font-medium flex items-center gap-2 transition cursor-pointer"
            title="Réinitialise aux questions officielles"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#B42318]" />
            <span>Réinitialiser défaut</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="h-[38px] w-[38px] rounded-lg border border-[#D6D3CA] hover:bg-[#F6F5F1] text-[#5B6675] hover:text-[#0F1B2D] flex items-center justify-center transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* STATUS NOTIFICATION (VibLab Alert Banner) */}
      {statusMsg && (
        <div className={`px-6 py-2.5 text-xs font-mono font-medium flex items-center gap-2.5 border-b transition ${
          statusMsg.type === 'error'
            ? 'bg-[#FEE4E2] border-[#FECDCA] text-[#B42318]'
            : statusMsg.type === 'info'
            ? 'bg-[#F3F6FA] border-[#D4E2F1] text-[#1F4E8C]'
            : 'bg-[#E3F1E9] border-[#B8DFCA] text-[#1E7A4F]'
        }`}>
          {statusMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B42318]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E7A4F]" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 2. MODULE SELECTION TABS (Horizontal Clean Strip) */}
      <div className="px-5 py-3 border-b border-[#E3E1DA] bg-[#FAF9F6] overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          {modules.map((m) => {
            const isSelected = m.id === activeModuleId;
            const trapCount = m.qs.filter(q => q.isTrap).length;
            const mActiveCount = m.qs.filter(q => q.enabled !== false).length;
            const mConf = configs[m.id];
            const passPct = mConf?.passScore ?? 85;

            return (
              <button
                key={m.id}
                onClick={() => setActiveModuleId(m.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F1B2D] text-white border-[#0F1B2D] shadow-xs'
                    : 'bg-white hover:bg-[#F6F5F1] text-[#1C2733] border-[#E3E1DA]'
                }`}
              >
                <div className={`w-5 h-5 rounded font-mono text-[11px] font-semibold flex items-center justify-center ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF9F6] border border-[#E3E1DA] text-[#5B6675]'
                }`}>
                  {m.id}
                </div>
                <div className="text-left">
                  <div className={`leading-tight font-semibold line-clamp-1 text-[13px] ${
                    isSelected ? 'text-white' : 'text-[#1C2733]'
                  }`}>
                    {m.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                    <span className={isSelected ? 'text-slate-300' : 'text-[#5B6675]'}>
                      {mActiveCount < m.qs.length ? `${mActiveCount}/${m.qs.length} Qs` : `${m.qs.length} Qs`}
                    </span>
                    {trapCount > 0 && (
                      <span className={`font-semibold flex items-center gap-0.5 ${
                        isSelected ? 'text-[#E8A317]' : 'text-[#7A4A00]'
                      }`}>
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {trapCount} pièges
                      </span>
                    )}
                    <span className={isSelected ? 'text-slate-200' : 'text-[#1E7A4F]'}>
                      {passPct}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CONTENT: CONFIG PANEL (LEFT) + QUESTIONS LIST (RIGHT) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT SIDEBAR: RULES & CONFIGURATION (300px) */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#E3E1DA] bg-[#FAF9F6] p-5 overflow-y-auto space-y-5 text-[13px]">
          
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E3E1DA]">
            <Settings className="w-4 h-4 text-[#5B6675]" />
            <h3 className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider">
              RÈGLES DU MODULE & EXAMEN
            </h3>
          </div>

          {/* Seuil de validation */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-medium text-[#1C2733] flex items-center gap-1.5 text-[12.5px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1E7A4F]" />
                Seuil de réussite requis :
              </label>
              <span className="px-2 py-0.5 rounded font-mono font-semibold text-xs bg-white border border-[#D6D3CA] text-[#0F1B2D]">
                {activeConfig.passScore}%
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              step="5"
              value={activeConfig.passScore}
              onChange={(e) => handleUpdateConfig('passScore', Number(e.target.value))}
              className="w-full accent-[#0F1B2D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#8A929C] mt-1">
              <span>70% (Souple)</span>
              <span className="font-semibold text-[#0F1B2D]">85% (Recommandé)</span>
              <span>95% (Excellence)</span>
            </div>
          </div>

          {/* Questions tirées par session d'examen */}
          <div>
            <label className="font-medium text-[#1C2733] block mb-1.5 text-[12.5px]">
              Questions tirées par session :
            </label>
            <select
              value={activeConfig.questionsPerExam || 30}
              onChange={(e) => handleUpdateConfig('questionsPerExam', Number(e.target.value))}
              disabled={Boolean(activeConfig.useExactSelection)}
              className="w-full h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] font-medium outline-none disabled:opacity-50 disabled:bg-[#F6F5F1]"
            >
              <option value={30}>30 questions tirées au sort (Standard officiel)</option>
              <option value={20}>20 questions sélectionnées</option>
              <option value={25}>25 questions sélectionnées</option>
              <option value={40}>40 questions sélectionnées</option>
              <option value={0}>Toutes les questions actives ({moduleStats.activeCount} Qs)</option>
            </select>
            {activeConfig.useExactSelection && (
              <span className="text-[11px] text-[#7A4A00] font-medium block mt-1">
                (Désactivé : le mode « Sélection exacte » est fixé ci-dessous)
              </span>
            )}
          </div>

          {/* Durée limite / Chronomètre */}
          <div>
            <label className="font-medium text-[#1C2733] block mb-1.5 text-[12.5px]">
              Temps alloué (minutes) :
            </label>
            <input
              type="number"
              min="0"
              max="120"
              step="5"
              value={activeConfig.timeLimitMin || 45}
              onChange={(e) => handleUpdateConfig('timeLimitMin', Number(e.target.value))}
              className="w-full h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] font-medium outline-none"
            />
            <span className="text-[11px] text-[#5B6675] mt-1 block">
              Recommandé : 45 min pour 30 questions (0 = illimité).
            </span>
          </div>

          {/* Visibilité dans l'examen */}
          <div className="p-4 rounded-lg border border-[#E3E1DA] bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase text-[#5B6675] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#5B6675]" />
                Visibilité examen
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-semibold text-[11px] bg-[#FAF9F6] border border-[#E3E1DA] text-[#0F1B2D]">
                {moduleStats.activeCount} / {moduleStats.total} actives
              </span>
            </div>
            <p className="text-[11.5px] text-[#5B6675] leading-snug">
              Activez ou masquez individuellement chaque question, ou appliquez une action globale :
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleAllQuestions(true)}
                className="h-[32px] px-2 rounded-lg text-xs font-medium border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Faire apparaître toutes les questions dans l'examen"
              >
                <Eye className="w-3.5 h-3.5 text-[#1E7A4F]" />
                Tout activer
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllQuestions(false)}
                className="h-[32px] px-2 rounded-lg text-xs font-medium border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#5B6675] flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Masquer toutes les questions de l'examen"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Tout masquer
              </button>
            </div>

            {/* Verrouillage : Sélection exacte */}
            <div className="pt-2.5 mt-2 border-t border-[#EEECE6]">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 font-medium text-[12px] text-[#1C2733]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E8A317]" />
                  <span>Fixer ma sélection exacte</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(activeConfig.useExactSelection)}
                  onChange={(e) => handleUpdateConfig('useExactSelection', e.target.checked)}
                  className="rounded accent-[#E8A317] w-4 h-4 cursor-pointer"
                />
              </label>
              <p className={`text-[11px] mt-1 leading-snug ${
                activeConfig.useExactSelection ? 'text-[#7A4A00] font-medium' : 'text-[#8A929C]'
              }`}>
                {activeConfig.useExactSelection
                  ? `Actif : SEULES les ${moduleStats.activeCount} questions cochées apparaîtront à l'élève.`
                  : `Standard : 30 questions aléatoires parmi les ${moduleStats.activeCount} actives.`}
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#E3E1DA]">
            <label className="flex items-center justify-between cursor-pointer text-[12.5px] text-[#1C2733]">
              <span className="flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-[#5B6675]" />
                Mélanger les questions
              </span>
              <input
                type="checkbox"
                checked={activeConfig.shuffleQuestions}
                onChange={(e) => handleUpdateConfig('shuffleQuestions', e.target.checked)}
                className="rounded accent-[#0F1B2D] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-[12.5px] text-[#1C2733]">
              <span className="flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-[#5B6675]" />
                Mélanger les réponses
              </span>
              <input
                type="checkbox"
                checked={activeConfig.shuffleOptions}
                onChange={(e) => handleUpdateConfig('shuffleOptions', e.target.checked)}
                className="rounded accent-[#0F1B2D] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-[12.5px] text-[#1C2733]">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#5B6675]" />
                Autoriser les calculateurs
              </span>
              <input
                type="checkbox"
                checked={activeConfig.allowCalc}
                onChange={(e) => handleUpdateConfig('allowCalc', e.target.checked)}
                className="rounded accent-[#0F1B2D] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-[12.5px] text-[#1C2733]">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#E8A317]" />
                Afficher le badge piège en examen
              </span>
              <input
                type="checkbox"
                checked={activeConfig.showTrapBadgeDuringExam}
                onChange={(e) => handleUpdateConfig('showTrapBadgeDuringExam', e.target.checked)}
                className="rounded accent-[#0F1B2D] w-4 h-4 cursor-pointer"
              />
            </label>
            <span className="text-[10px] text-[#8A929C] block pl-5">
              (Désactivé par défaut pour préserver le réalisme de l'épreuve)
            </span>
          </div>

          {/* Module Overview Statistics */}
          <div className="p-3.5 rounded-lg border border-[#E3E1DA] bg-white space-y-2">
            <div className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider">
              STATISTIQUES DU MODULE
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]">
                <div className="text-[10px] font-mono text-[#8A929C] uppercase">Total / Actives</div>
                <div className="font-mono font-semibold text-base text-[#0F1B2D]">
                  {moduleStats.activeCount} <span className="text-xs text-[#8A929C]">/ {moduleStats.total}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]">
                <div className="text-[10px] font-mono text-[#8A929C] uppercase">Pièges de terrain</div>
                <div className="font-mono font-semibold text-base text-[#7A4A00]">{moduleStats.traps}</div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]">
                <div className="text-[10px] font-mono text-[#8A929C] uppercase">QCU / QCM</div>
                <div className="font-mono font-semibold text-base text-[#1C2733]">{moduleStats.single + moduleStats.multi}</div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]">
                <div className="text-[10px] font-mono text-[#8A929C] uppercase">Calcul Numérique</div>
                <div className="font-mono font-semibold text-base text-[#1C2733]">{moduleStats.num}</div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT AREA: QUESTION LIST & CONTROLS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF9F6]">
          
          {/* TOOLBAR */}
          <div className="p-4 border-b border-[#E3E1DA] bg-white flex flex-wrap items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A929C]" />
              <input
                type="text"
                placeholder="Rechercher par mot-clé, énoncé, formule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[38px] pl-9 pr-8 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] outline-none placeholder-[#8A929C]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A929C] hover:text-[#1C2733]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Visibility filter */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] font-medium outline-none"
            >
              <option value="all">Toutes ({activeModule.qs.length})</option>
              <option value="enabled_only">Actives dans l'examen ({moduleStats.activeCount})</option>
              <option value="disabled_only">Masquées / Inactives ({moduleStats.disabledCount})</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] font-medium outline-none"
            >
              <option value="all">Tous les types ({activeModule.qs.length})</option>
              <option value="single">Choix unique (QCU)</option>
              <option value="multi">Choix multiples (QCM)</option>
              <option value="num">Calcul Numérique</option>
            </select>

            {/* Trap filter */}
            <select
              value={trapFilter}
              onChange={(e) => setTrapFilter(e.target.value as any)}
              className="h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] font-medium outline-none"
            >
              <option value="all">Toutes questions</option>
              <option value="trap_only">Pièges de terrain ({moduleStats.traps})</option>
              <option value="standard_only">Questions standards</option>
            </select>

            {/* Kahoot filter */}
            <select
              value={kahootFilter}
              onChange={(e) => setKahootFilter(e.target.value as any)}
              className="h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] font-medium outline-none"
            >
              <option value="all">Tous statut Kahoot</option>
              <option value="kahoot_only">🎯 Inclus Kahoot ({moduleStats.kahootCount})</option>
              <option value="non_kahoot">Non-Kahoot ({activeModule.qs.length - moduleStats.kahootCount})</option>
            </select>

            {/* Add Question Button (Single Primary Marine) */}
            <button
              onClick={() => {
                setEditingQuestion({
                  moduleIndex: activeModuleIndex,
                  questionIndex: null,
                  data: {
                    t: '',
                    type: 'single',
                    enabled: true,
                    inKahoot: true,
                    o: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                    a: 0,
                    e: '',
                    isTrap: false,
                    difficulty: 'standard'
                  }
                });
              }}
              className="h-[38px] px-4 rounded-lg bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white text-[13px] font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une question</span>
            </button>
          </div>

          {/* KAHOOT LIVE MODULE MANAGEMENT BANNER */}
          <div className="px-5 py-3 border-b border-[#E3E1DA] bg-[#F5F3FF] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#6D28D9] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                🎯
              </span>
              <div>
                <div className="font-semibold text-[#3B0764] flex items-center gap-2">
                  <span>Questions Kahoot Live — {activeModule.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]">
                    {moduleStats.kahootCount} sélectionnée{moduleStats.kahootCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-[11px] text-[#6D28D9]/80">
                  Configurez quelles questions de ce module sont jouées lors des sessions Kahoot interactives.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAutoSelectKahoot(15)}
                className="h-8 px-3 rounded-lg bg-white border border-[#C4B5FD] text-[#6D28D9] font-medium hover:bg-[#EDE9FE] transition cursor-pointer flex items-center gap-1.5 text-xs shadow-2xs"
                title="Sélectionne automatiquement les pièges et notions clés du module pour une session Kahoot de 15 questions"
              >
                <span>⚡</span>
                <span>Auto-sélection (15 Qs)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllKahoot(true)}
                className="h-8 px-2.5 rounded-lg bg-white border border-[#D6D3CA] text-[#4C1D95] hover:bg-[#FAF9F6] transition cursor-pointer text-xs"
              >
                Tout inclure
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllKahoot(false)}
                className="h-8 px-2.5 rounded-lg bg-white border border-[#D6D3CA] text-[#5B6675] hover:text-[#B42318] hover:bg-[#FAF9F6] transition cursor-pointer text-xs"
              >
                Désélectionner tout
              </button>
            </div>
          </div>

          {/* QUESTIONS LIST */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[#E3E1DA] rounded-xl p-8">
                <FileQuestion className="w-10 h-10 text-[#8A929C] mx-auto mb-2 opacity-50" />
                <h4 className="font-semibold text-sm text-[#1C2733]">Aucune question ne correspond aux critères</h4>
                <p className="text-xs text-[#5B6675] mt-1">Modifiez vos filtres ou effectuez une autre recherche.</p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const realIndex = activeModule.qs.findIndex(orig => orig === q);
                const isEnabled = q.enabled !== false;

                return (
                  <div
                    key={realIndex}
                    className={`p-4 rounded-xl border transition-all ${
                      !isEnabled
                        ? 'bg-[#FAF9F6] border-dashed border-[#D6D3CA] opacity-80'
                        : q.isTrap
                        ? 'bg-[#FDFBF7] border-[#F1D699]'
                        : 'bg-white border-[#E3E1DA]'
                    }`}
                  >
                    {/* Top Control Bar */}
                    <div className="flex items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-[#EEECE6] flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-[#FAF9F6] border border-[#E3E1DA] text-[#0F1B2D]">
                          #{realIndex + 1}
                        </span>

                        {/* Interactive Switch Toggle QCM */}
                        <button
                          type="button"
                          onClick={() => handleToggleQuestionEnabled(realIndex)}
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer select-none ${
                            isEnabled
                              ? 'bg-[#E3F1E9] border-[#B8DFCA] text-[#1E7A4F]'
                              : 'bg-[#FAF9F6] border-[#D6D3CA] text-[#5B6675]'
                          }`}
                          title={isEnabled ? "Cliquez pour masquer cette question" : "Cliquez pour inclure cette question"}
                        >
                          <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-[#1E7A4F]' : 'bg-[#8A929C]'}`} />
                          <span className="font-mono text-[11px]">
                            {isEnabled ? 'QCM Examen' : 'Masquée QCM'}
                          </span>
                        </button>

                        {/* Kahoot Live Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleQuestionKahoot(realIndex)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer select-none ${
                            q.inKahoot
                              ? 'bg-[#EDE9FE] border-[#C4B5FD] text-[#6D28D9] font-semibold'
                              : 'bg-[#FAF9F6] border-[#D6D3CA] text-[#8A929C] hover:text-[#6D28D9] hover:border-[#C4B5FD]'
                          }`}
                          title={q.inKahoot ? "Question incluse dans le Kahoot Live (Cliquer pour retirer)" : "Cliquer pour inclure dans le Kahoot Live"}
                        >
                          <span>🎯</span>
                          <span className="font-mono text-[11px]">
                            {q.inKahoot ? 'Kahoot Actif' : '+ Kahoot'}
                          </span>
                        </button>
                      </div>

                      {/* Right Action Icons */}
                      <div className="flex items-center gap-2">
                        {q.tool && (
                          <button
                            type="button"
                            onClick={() => setPreviewTool({ type: q.tool as ToolType, pre: q.pre })}
                            className="px-2.5 py-1 rounded text-[11px] font-mono font-medium text-[#1F4E8C] bg-[#F3F6FA] border border-[#D4E2F1] hover:bg-[#E8EFF7] flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Calculator className="w-3 h-3" />
                            <span>Abaque {q.tool.toUpperCase()} ↗</span>
                          </button>
                        )}

                        <div className="h-4 w-[1px] bg-[#E3E1DA] hidden sm:block" />

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 text-[#5B6675]">
                          <button
                            onClick={() => handleMoveQuestion(realIndex, 'up')}
                            disabled={realIndex === 0}
                            className="p-1 rounded hover:bg-[#F6F5F1] hover:text-[#0F1B2D] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveQuestion(realIndex, 'down')}
                            disabled={realIndex === activeModule.qs.length - 1}
                            className="p-1 rounded hover:bg-[#F6F5F1] hover:text-[#0F1B2D] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateQuestion(realIndex)}
                            className="p-1 rounded hover:bg-[#F6F5F1] hover:text-[#0F1B2D] transition cursor-pointer"
                            title="Dupliquer la question"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestion({
                                moduleIndex: activeModuleIndex,
                                questionIndex: realIndex,
                                data: JSON.parse(JSON.stringify(q))
                              });
                            }}
                            className="p-1 rounded hover:bg-[#F6F5F1] hover:text-[#0F1B2D] transition cursor-pointer"
                            title="Modifier la question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(realIndex)}
                            className="p-1 rounded hover:bg-[#FEE4E2] hover:text-[#B42318] transition cursor-pointer"
                            title="Supprimer la question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span className="font-mono text-[10px] text-[#8A929C] uppercase select-none">
                        Légende :
                      </span>

                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F3F6FA] text-[#1F4E8C] border border-[#D4E2F1]">
                        {q.type === 'num' ? 'Calcul Numérique' : q.type === 'multi' ? 'Choix Multiples (QCM)' : 'Choix Unique (QCU)'}
                      </span>

                      {q.isTrap && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FDF6E7] text-[#7A4A00] border border-[#F1D699] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#E8A317]" />
                          Piège de terrain
                        </span>
                      )}

                      {q.gravity && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#5B6675] bg-[#FAF9F6] border border-[#E3E1DA]">
                          Gravité : {q.gravity.replace('_', ' ')}
                        </span>
                      )}

                      {(q.image || (q as any).imageUrl) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Photo jointe
                        </span>
                      )}
                    </div>

                    {/* Question Title */}
                    <div className="text-[14.5px] font-semibold text-[#1C2733] leading-snug mb-2">
                      {q.t}
                    </div>

                    {/* Optional Question Image Thumbnail */}
                    {(q.image || (q as any).imageUrl) && (
                      <div className="mb-3 p-2 bg-[#FAF9F6] border border-[#E3E1DA] rounded-lg inline-flex items-center gap-3">
                        <img
                          src={q.image || (q as any).imageUrl}
                          alt="Illustration question"
                          onClick={() => setZoomImage(q.image || (q as any).imageUrl || null)}
                          className="h-16 max-w-[140px] object-cover rounded border border-[#D6D3CA] cursor-pointer hover:opacity-90 transition shadow-2xs"
                          title="Cliquer pour agrandir la photo"
                        />
                        <div className="text-xs text-[#5B6675]">
                          <span className="font-semibold text-[#0F1B2D] block flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-[#0369A1]" />
                            <span>Photo / Spectre illustratif</span>
                          </span>
                          <span className="text-[11px] text-[#8A929C]">Visible pour les apprenants en QCM & Kahoot Live (cliquer pour zoomer)</span>
                        </div>
                      </div>
                    )}

                    {/* Options or Numeric Details */}
                    {q.type === 'num' ? (
                      <div className="p-3 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6] text-xs mb-2">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <span className="text-[#5B6675]">Valeur attendue :</span>{' '}
                            <span className="font-mono font-semibold text-[#1E7A4F]">{q.a}</span>
                          </div>
                          <div>
                            <span className="text-[#5B6675]">Tolérance :</span>{' '}
                            <span className="font-mono font-medium text-[#1C2733]">± {q.tol}</span>
                          </div>
                          <div>
                            <span className="text-[#5B6675]">Unité :</span>{' '}
                            <span className="font-mono font-semibold text-[#0F1B2D]">{q.unit}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 text-xs">
                        {q.o?.map((opt, optIdx) => {
                          const isCorrect = q.type === 'single'
                            ? q.a === optIdx
                            : Array.isArray(q.a) && (q.a as number[]).includes(optIdx);

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border flex items-start gap-2.5 text-[13px] ${
                                isCorrect
                                  ? 'bg-[#E3F1E9] border-[#B8DFCA] text-[#1E7A4F] font-medium'
                                  : 'bg-[#FAF9F6] border-[#E3E1DA] text-[#1C2733]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-mono ${
                                isCorrect ? 'bg-[#1E7A4F] text-white font-bold' : 'bg-white border border-[#D6D3CA] text-[#5B6675]'
                              }`}>
                                {isCorrect ? '✓' : String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="line-clamp-2 leading-snug">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Trap Warning Alert */}
                    {q.isTrap && q.trapWarning && (
                      <div className="mt-2.5 p-3 rounded-lg border border-[#F1D699] bg-[#FDF6E7] text-[#7A4A00] text-xs flex items-start gap-2 leading-relaxed">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E8A317]" />
                        <div>
                          <span className="font-semibold">Mise en garde du piège :</span> {q.trapWarning}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.e && (
                      <div className="mt-2 text-xs p-3 rounded-lg border border-[#D4E2F1] bg-[#F3F6FA] text-[#1F4E8C] leading-relaxed">
                        <span className="font-semibold">Explication pédagogique :</span> {q.e}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. EDIT / ADD QUESTION MODAL */}
      {editingQuestion && (
        <EditQuestionModal
          theme={theme}
          isOpen={true}
          initialData={editingQuestion.data}
          isNew={editingQuestion.questionIndex === null}
          onSave={handleSaveQuestionModal}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* 5. LIVE CALCULATOR PREVIEW MODAL */}
      {previewTool && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#E3E1DA] bg-white shadow-xl p-6 relative">
            <button
              onClick={() => setPreviewTool(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg border border-[#D6D3CA] hover:bg-[#F6F5F1] text-[#5B6675] hover:text-[#0F1B2D]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mb-4">
              <span className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider">
                OUTIL D’EXPERTISE
              </span>
              <h3 className="text-base font-semibold text-[#0F1B2D] mt-0.5">
                Aperçu du Calculateur ({previewTool.type.toUpperCase()})
              </h3>
            </div>
            <FormationCalc
              initialTool={previewTool.type}
              initialPre={previewTool.pre}
              theme="light"
            />
          </div>
        </div>
      )}

      {/* 6. IMAGE ZOOM MODAL */}
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

// ----------------------------------------------------
// EDIT QUESTION MODAL (VibLab Industrial Style)
// ----------------------------------------------------
interface EditQuestionModalProps {
  theme: 'dark' | 'light' | 'mono';
  isOpen: boolean;
  initialData: FormationQuestion;
  isNew: boolean;
  onSave: (q: FormationQuestion) => void;
  onClose: () => void;
}

function EditQuestionModal({
  isOpen,
  initialData,
  isNew,
  onSave,
  onClose
}: EditQuestionModalProps) {
  const [t, setT] = useState<string>(initialData.t || '');
  const [enabled, setEnabled] = useState<boolean>(initialData.enabled !== false);
  const [inKahoot, setInKahoot] = useState<boolean>(initialData.inKahoot !== false);
  const [image, setImage] = useState<string>(initialData.image || (initialData as any).imageUrl || '');
  const [type, setType] = useState<QuestionType>(initialData.type || 'single');
  const [e, setE] = useState<string>(initialData.e || '');
  const [hint, setHint] = useState<string>(initialData.hint || '');
  const [isTrap, setIsTrap] = useState<boolean>(Boolean(initialData.isTrap));
  const [trapWarning, setTrapWarning] = useState<string>(initialData.trapWarning || '');
  const [tool, setTool] = useState<string>(initialData.tool || '');

  const handleFileUpload = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Veuillez sélectionner une image inférieure à 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [options, setOptions] = useState<string[]>(() => {
    if (initialData.type === 'single' || initialData.type === 'multi') {
      return [...initialData.o];
    }
    return ['Proposition A', 'Proposition B', 'Proposition C', 'Proposition D'];
  });

  const [singleCorrect, setSingleCorrect] = useState<number>(() => {
    if (initialData.type === 'single') return initialData.a;
    return 0;
  });

  const [multiCorrect, setMultiCorrect] = useState<number[]>(() => {
    if (initialData.type === 'multi' && Array.isArray(initialData.a)) {
      return [...initialData.a];
    }
    return [0];
  });

  const [numVal, setNumVal] = useState<number>(() => {
    if (initialData.type === 'num') return initialData.a;
    return 10.0;
  });
  const [numTol, setNumTol] = useState<number>(() => {
    if (initialData.type === 'num') return initialData.tol;
    return 0.5;
  });
  const [numUnit, setNumUnit] = useState<string>(() => {
    if (initialData.type === 'num') return initialData.unit;
    return 'mm/s RMS';
  });

  const handleToggleMulti = (index: number) => {
    if (multiCorrect.includes(index)) {
      if (multiCorrect.length > 1) {
        setMultiCorrect(multiCorrect.filter(i => i !== index));
      }
    } else {
      setMultiCorrect([...multiCorrect, index].sort((a, b) => a - b));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const copy = [...options];
    copy[index] = val;
    setOptions(copy);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, `Nouvelle option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const copy = options.filter((_, i) => i !== index);
    setOptions(copy);
    if (singleCorrect >= copy.length) setSingleCorrect(0);
    setMultiCorrect(multiCorrect.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const handleFormSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!t.trim()) {
      alert('Veuillez saisir l’énoncé de la question.');
      return;
    }

    let finalQ: FormationQuestion;

    const baseData = {
      t: t.trim(),
      enabled,
      inKahoot,
      image: image.trim() || undefined,
      imageUrl: image.trim() || undefined,
      e: e.trim(),
      hint: hint.trim() || undefined,
      isTrap,
      trapWarning: isTrap ? trapWarning.trim() : undefined,
      tool: (tool ? tool : undefined) as any,
      difficulty: isTrap ? ('piege' as const) : ('standard' as const)
    };

    if (type === 'num') {
      finalQ = {
        ...baseData,
        type: 'num',
        a: Number(numVal),
        tol: Number(numTol),
        unit: numUnit.trim()
      };
    } else if (type === 'multi') {
      finalQ = {
        ...baseData,
        type: 'multi',
        o: options.map(o => o.trim()),
        a: multiCorrect
      };
    } else {
      finalQ = {
        ...baseData,
        type: 'single',
        o: options.map(o => o.trim()),
        a: singleCorrect
      };
    }

    onSave(finalQ);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-[#E3E1DA] bg-white shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3E1DA] bg-[#FAF9F6] flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] font-semibold text-[#8A929C] uppercase tracking-wider">
              ÉDITEUR DE QUESTION
            </span>
            <h3 className="font-semibold text-base text-[#0F1B2D] mt-0.5">
              {isNew ? 'Créer une nouvelle question' : 'Éditer la question'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#D6D3CA] hover:bg-white text-[#5B6675] hover:text-[#0F1B2D] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-[13px]">
          
          {/* Énoncé */}
          <div>
            <label className="font-medium text-[#1C2733] block mb-1 text-[12.5px]">
              Énoncé de la question :
            </label>
            <textarea
              rows={3}
              value={t}
              onChange={(e) => setT(e.target.value)}
              placeholder="Ex: Sur un spectre de vibration, que signifie un pic dominant à 2x avec 180° de déphasage ?"
              className="w-full p-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] outline-none"
              required
            />
          </div>

          {/* Activation dans l'examen & Kahoot Live */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 font-medium text-[13px] text-[#1C2733]">
                  {enabled ? <Eye className="w-4 h-4 text-[#1E7A4F]" /> : <EyeOff className="w-4 h-4 text-[#8A929C]" />}
                  Visible dans l'examen QCM
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0F1B2D] cursor-pointer"
                />
              </label>
            </div>

            <div className="p-3.5 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF]">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 font-medium text-[13px] text-[#4C1D95]">
                  <span className="text-base">🎯</span>
                  <span>Inclus dans <strong>Kahoot Live</strong></span>
                </span>
                <input
                  type="checkbox"
                  checked={inKahoot}
                  onChange={(e) => setInKahoot(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#6D28D9] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Illustration / Photo de la question */}
          <div className="p-3.5 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[#1C2733] text-[12.5px] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#0369A1]" />
                <span>Photo, Spectre ou Schéma explicatif (Optionnel) :</span>
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="text-xs text-[#B42318] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Supprimer la photo</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="URL de l'image (https://...) ou importer ci-contre"
                className="flex-1 h-[36px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-xs outline-none"
              />
              <label className="h-[36px] px-3 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Choisir photo...</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {image && (
              <div className="relative mt-2 p-2 bg-white rounded-lg border border-[#E3E1DA] inline-block">
                <img
                  src={image}
                  alt="Illustration"
                  className="max-h-40 max-w-full rounded object-contain border border-[#EEECE6]"
                />
                <div className="text-[11px] text-[#8A929C] mt-1 font-mono">
                  Aperçu de la photo qui sera affichée aux apprenants
                </div>
              </div>
            )}
          </div>

          {/* Type & Outil de calcul */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-[#1C2733] block mb-1 text-[12.5px]">
                Type de question :
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] outline-none font-medium"
              >
                <option value="single">Choix Unique (QCU - 1 seule bonne réponse)</option>
                <option value="multi">Choix Multiples (QCM - plusieurs bonnes réponses)</option>
                <option value="num">Calcul Numérique (valeur exacte + tolérance)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#1C2733] block mb-1 text-[12.5px]">
                Calculateur / Abaque associé :
              </label>
              <select
                value={tool}
                onChange={(e) => setTool(e.target.value)}
                className="w-full h-[38px] px-3 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-[13px] outline-none font-medium"
              >
                <option value="">Aucun outil spécifique</option>
                <option value="iso">Norme ISO 10816-3 (Zones A/B/C/D & Seuils)</option>
                <option value="harmonics">Calculateur d'Harmoniques & Sous-harmoniques</option>
                <option value="bearing">Fréquences Défauts Roulements (BPFO, BPFI, BSF, FTF)</option>
                <option value="unit">Convertisseur Déplacement / Vitesse / Accélération</option>
                <option value="resonance">Calcul de Résonance & Vitesse Critique</option>
                <option value="gear">Engrenages : Fréquence d'Engrènement (GMF)</option>
              </select>
            </div>
          </div>

          {/* OPTIONS BUILDER (FOR SINGLE & MULTI) */}
          {type !== 'num' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#1C2733] text-[12.5px]">
                  Propositions de réponses :
                </label>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-mono text-[#0F1B2D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une option</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, oIdx) => {
                  const isChecked = type === 'single' ? singleCorrect === oIdx : multiCorrect.includes(oIdx);

                  return (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition ${
                        isChecked
                          ? 'bg-[#E3F1E9] border-[#B8DFCA]'
                          : 'bg-white border-[#E3E1DA]'
                      }`}
                    >
                      <input
                        type={type === 'single' ? 'radio' : 'checkbox'}
                        name="correctAnswerSelect"
                        checked={isChecked}
                        onChange={() => {
                          if (type === 'single') setSingleCorrect(oIdx);
                          else handleToggleMulti(oIdx);
                        }}
                        className="w-4 h-4 accent-[#0F1B2D] cursor-pointer shrink-0"
                      />

                      <span className="font-mono text-xs font-semibold text-[#5B6675] w-5">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 p-2 rounded border border-[#D6D3CA] bg-white text-[#1C2733] text-xs outline-none"
                        required
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(oIdx)}
                          className="p-1 rounded text-[#8A929C] hover:text-[#B42318] hover:bg-[#FEE4E2] transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {options.length === 2 && (
                <div className="p-2.5 rounded-lg border border-[#D4E2F1] bg-[#F3F6FA] text-[#1F4E8C] text-xs flex items-center gap-2">
                  <span>💡</span>
                  <span>Question à 2 choix (A et B) : Dans Kahoot Live, l'application n'affichera que les boutons A et B sur l'écran des apprenants (aucun bouton C ou D superflu).</span>
                </div>
              )}
            </div>
          )}

          {/* NUMERIC SETTINGS */}
          {type === 'num' && (
            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border border-[#E3E1DA] bg-[#FAF9F6]">
              <div>
                <label className="font-medium text-[#1C2733] block mb-1 text-[12px]">Valeur exacte :</label>
                <input
                  type="number"
                  step="any"
                  value={numVal}
                  onChange={(e) => setNumVal(Number(e.target.value))}
                  className="w-full h-[36px] px-3 rounded border border-[#D6D3CA] bg-white text-[#1C2733] font-mono text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-medium text-[#1C2733] block mb-1 text-[12px]">Tolérance (±) :</label>
                <input
                  type="number"
                  step="any"
                  value={numTol}
                  onChange={(e) => setNumTol(Number(e.target.value))}
                  className="w-full h-[36px] px-3 rounded border border-[#D6D3CA] bg-white text-[#1C2733] font-mono text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-medium text-[#1C2733] block mb-1 text-[12px]">Unité :</label>
                <input
                  type="text"
                  value={numUnit}
                  onChange={(e) => setNumUnit(e.target.value)}
                  placeholder="ex: mm/s RMS"
                  className="w-full h-[36px] px-3 rounded border border-[#D6D3CA] bg-white text-[#1C2733] font-mono text-xs outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* PIÈGE DE TERRAIN CONFIGURATION */}
          <div className="p-4 rounded-lg border border-[#F1D699] bg-[#FDF6E7] space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-xs text-[#7A4A00] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#E8A317]" />
                Marquer comme « Piège de terrain »
              </span>
              <input
                type="checkbox"
                checked={isTrap}
                onChange={(e) => setIsTrap(e.target.checked)}
                className="w-4 h-4 rounded accent-[#E8A317] cursor-pointer"
              />
            </label>

            {isTrap && (
              <div>
                <label className="font-medium text-[#7A4A00] block mb-1 text-[12px]">
                  Mise en garde du piège (affichée lors de la correction) :
                </label>
                <textarea
                  rows={2}
                  value={trapWarning}
                  onChange={(e) => setTrapWarning(e.target.value)}
                  placeholder="Ex: Attention à ne pas confondre le glissement avec un défaut de roulement BPFO..."
                  className="w-full p-2.5 rounded-lg border border-[#F1D699] bg-white text-[#1C2733] text-xs outline-none"
                />
              </div>
            )}
          </div>

          {/* EXPLICATION PÉDAGOGIQUE */}
          <div>
            <label className="font-medium text-[#1C2733] block mb-1 text-[12.5px]">
              Explication pédagogique détaillée :
            </label>
            <textarea
              rows={3}
              value={e}
              onChange={(e) => setE(e.target.value)}
              placeholder="Ex: Selon l'ISO 10816-3, la vitesse RMS est l'indicateur universel pour les machines de 10 Hz à 1000 Hz..."
              className="w-full p-2.5 rounded-lg border border-[#D6D3CA] bg-white text-[#1C2733] text-xs outline-none"
            />
          </div>

          {/* ACTIONS (Bottom Bar) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E1DA]">
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] px-4 rounded-lg border border-[#D6D3CA] bg-white hover:bg-[#F6F5F1] text-[#0F1B2D] text-[13px] font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="h-[38px] px-5 rounded-lg bg-[#0F1B2D] hover:bg-[#1C2A3D] text-white text-[13px] font-medium transition cursor-pointer shadow-xs"
            >
              {isNew ? 'Créer la question' : 'Enregistrer les modifications'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
