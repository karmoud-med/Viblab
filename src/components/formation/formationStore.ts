import { FormationModule, FormationQuestion, MODULES_DATA, ModuleConfig, DEFAULT_CONFIGS_DATA } from './formationData';
import { 
  saveQuizQuestionsToSqlite, 
  getQuizQuestionsFromSqlite, 
  saveModuleQuizConfigsToSqlite, 
  getModuleQuizConfigsFromSqlite 
} from '../../services/sqliteDatabase';

const STORAGE_KEY_MODULES = 'viblab_qcm_modules_v9';
const STORAGE_KEY_CONFIGS = 'viblab_qcm_configs_v9';
export const STORAGE_KEY_KAHOOT_SELECTED = 'viblab_kahoot_selected_questions_v1';
export const STORAGE_KEY_KAHOOT_SETTINGS = 'viblab_kahoot_trainer_settings_v1';

export function getKahootQuestionKey(q: { t: string; id?: string }, modId?: number): string {
  if (q.id) return q.id;
  return `${modId !== undefined ? modId : ''}::${q.t.trim()}`;
}

export function loadKahootSelectedKeys(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KAHOOT_SELECTED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erreur chargement clés Kahoot :', err);
  }
  return [];
}

export function saveKahootSelectedKeys(keys: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KAHOOT_SELECTED, JSON.stringify(keys));
    window.dispatchEvent(new CustomEvent('viblab_kahoot_questions_updated'));
  } catch (err) {
    console.error('Erreur sauvegarde clés Kahoot :', err);
  }
}

export interface KahootTrainerSettings {
  selectedModuleId?: number;
  timePerQuestion?: number;
  questionCount?: number;
  complexityFilter?: 'all' | 'traps_only' | 'fundamentals';
  isRandomOrder?: boolean;
  autoAdvanceOnAllAnswered?: boolean;
}

export function loadKahootTrainerSettings(): KahootTrainerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KAHOOT_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Erreur chargement réglages Kahoot :', err);
  }
  return {};
}

export function saveKahootTrainerSettings(settings: KahootTrainerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_KAHOOT_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Erreur sauvegarde réglages Kahoot :', err);
  }
}

/**
 * Charge les modules depuis le stockage local avec repli sur les modules par défaut enrichis
 * et hydrate automatiquement l'état inKahoot mémorisé pour chaque question
 */
export function loadFormationModules(): FormationModule[] {
  let loadedModules: FormationModule[] = MODULES_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedModules = parsed;
      }
    }
  } catch (err) {
    console.warn('Erreur chargement modules QCM personnalisés, repli sur défaut :', err);
  }

  // Hydrate les questions avec la liste persistante de questions Kahoot mémorisées
  const kahootKeys = new Set(loadKahootSelectedKeys());
  if (kahootKeys.size > 0) {
    loadedModules.forEach(mod => {
      if (Array.isArray(mod.qs)) {
        mod.qs.forEach(q => {
          const keyWithMod = getKahootQuestionKey(q, mod.id);
          const keyRaw = q.t.trim();
          if (kahootKeys.has(keyWithMod) || kahootKeys.has(keyRaw) || (q.id && kahootKeys.has(q.id))) {
            q.inKahoot = true;
          }
        });
      }
    });
  }

  return loadedModules;
}

/**
 * Sauvegarde les modules personnalisés dans le stockage et synchronise dans la base SQLite
 */
export function saveFormationModules(modules: FormationModule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(modules));
    
    // Extrait et synchronise également la liste dédiée des questions sélectionnées pour le Kahoot
    const activeKahootKeys: string[] = [];
    modules.forEach(m => {
      if (Array.isArray(m.qs)) {
        m.qs.forEach(q => {
          if (q.inKahoot === true) {
            activeKahootKeys.push(getKahootQuestionKey(q, m.id));
          }
        });
      }
    });
    saveKahootSelectedKeys(activeKahootKeys);

    // Sauvegarde permanente directe dans la base SQLite
    saveQuizQuestionsToSqlite(modules).catch(err => {
      console.warn('Sauvegarde asynchrone SQLite des questions:', err);
    });

    window.dispatchEvent(new CustomEvent('viblab_qcm_updated'));
  } catch (err) {
    console.error('Erreur sauvegarde modules QCM :', err);
  }
}

/**
 * Synchronise les modules et questions directement depuis la base SQLite
 */
export async function syncFormationFromSqlite(): Promise<FormationModule[]> {
  try {
    const sqliteModules = await getQuizQuestionsFromSqlite();
    if (sqliteModules && sqliteModules.length > 0) {
      localStorage.setItem(STORAGE_KEY_MODULES, JSON.stringify(sqliteModules));
      window.dispatchEvent(new CustomEvent('viblab_qcm_updated'));
      return sqliteModules;
    }
  } catch (err) {
    console.warn('Sync SQLite questions notice:', err);
  }
  return loadFormationModules();
}

export interface FormationStoreState {
  modules: FormationModule[];
  configs: Record<number, ModuleConfig>;
}

// Default configs for the 7 modules from the new question bank (30 questions par examen)
export const DEFAULT_CONFIGS: Record<number, ModuleConfig> = {
  1: {
    id: 1,
    title: 'Stratégie de maintenance & Fondamentaux',
    desc: 'Corrective, préventive, prédictive, proactive, précision · courbe P-F · techniques CM · cause racine · fiabilité',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
  2: {
    id: 2,
    title: 'Notions vibratoires',
    desc: 'Mouvement harmonique, période, fréquence, pulsation, phase · Déplacement, Vitesse, Accélération · Crête, Crête-à-crête, RMS, Facteur de crête',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
  3: {
    id: 3,
    title: 'Chaîne de mesure & collecte des données',
    desc: 'Capteurs piézoélectriques, vélocimètres, sondes de proximité · Montage et fixation (aimant, embase, goujon) · Fmax, résolution, lignes spectrales, fenêtrage',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
  4: {
    id: 4,
    title: "Indicateurs, normes & seuils d'alarme",
    desc: 'ISO 10816-3 / ISO 20816-3 (groupes 1 à 4, fondation rigide/souple, zones A/B/C/D) · Facteur de crête, Kurtosis, Crest Factor · Définition des seuils alerte et danger',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
  5: {
    id: 5,
    title: 'Diagnostic des défauts',
    desc: 'Balourd statique/dynamique/couple · Désalignement angulaire/parallèle · Desserrage mécanique et jeux · Défauts de roulements (BPFO, BPFI, BSF, FTF) · Engrenages et cavitation',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
  6: {
    id: 6,
    title: 'Pratique — Diagnostic sur scénarios',
    desc: 'Scénarios réels industriels : ventilateurs, pompes centrifuges, réducteurs, moteurs électriques · Analyse conjointe global + spectre + temporel · Recommandations de maintenance',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
  7: {
    id: 7,
    title: 'Pratique Niveau 1 — Du capteur au diagnostic',
    desc: 'Démarche complète de diagnostic Niveau 1 selon ISO 18436-2 · Choix du point de mesure, validation de la chaîne de mesure, analyse spectrale et rédaction du rapport d intervention',
    min: 45,
    passScore: 85,
    questionsPerExam: 30,
    useExactSelection: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowCalc: true,
    timeLimitMin: 45,
    showTrapBadgeDuringExam: false,
  },
};


/**
 * Charge les configurations de modules (seuils, questions par examen, etc.)
 */
export function loadModuleConfigs(): Record<number, ModuleConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIGS, ...parsed };
    }
  } catch (err) {
    console.warn('Erreur chargement configs QCM, repli sur défaut :', err);
  }
  return { ...DEFAULT_CONFIGS };
}

/**
 * Sauvegarde les configurations de modules et persiste dans SQLite
 */
export function saveModuleConfigs(configs: Record<number, ModuleConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(configs));
    saveModuleQuizConfigsToSqlite(configs).catch(err => {
      console.warn('Sauvegarde asynchrone SQLite des configurations:', err);
    });
    window.dispatchEvent(new CustomEvent('viblab_qcm_configs_updated'));
  } catch (err) {
    console.error('Erreur sauvegarde configs QCM :', err);
  }
}

/**
 * Réinitialise complètement les modules et configurations aux valeurs d'usine enrichies
 */
export function resetFormationToDefault(): { modules: FormationModule[]; configs: Record<number, ModuleConfig> } {
  localStorage.removeItem(STORAGE_KEY_MODULES);
  localStorage.removeItem(STORAGE_KEY_CONFIGS);
  window.dispatchEvent(new CustomEvent('viblab_qcm_updated'));
  window.dispatchEvent(new CustomEvent('viblab_qcm_configs_updated'));
  return {
    modules: MODULES_DATA,
    configs: { ...DEFAULT_CONFIGS }
  };
}

/**
 * Sélectionne et prépare les questions pour une session d'examen selon la configuration du module
 */
export function prepareExamQuestions(
  module: FormationModule,
  config: ModuleConfig
): { questions: FormationQuestion[]; originalIndices: number[] } {
  const allQs = [...module.qs];
  // Seules les questions activées par l'administrateur (enabled !== false) apparaissent dans l'examen
  const activeIndices = allQs
    .map((q, i) => ({ q, i }))
    .filter(item => item.q.enabled !== false)
    .map(item => item.i);

  // Repli de sécurité si aucune question n'est cochée
  const eligibleIndices = activeIndices.length > 0 ? activeIndices : allQs.map((_, i) => i);
  let indices = [...eligibleIndices];

  // Mélange aléatoire des questions si activé
  if (config.shuffleQuestions) {
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }

  // Sélection des questions selon le mode fixé par l'administrateur :
  // Si useExactSelection === true : SEULES les questions explicitement activées par l'admin sont présentées (pas de tirage aléatoire)
  // Sinon : tirage aléatoire de 30 questions parmi les questions actives
  let chosenIndices: number[];
  if (config.useExactSelection) {
    chosenIndices = indices;
  } else {
    const targetCount = config.questionsPerExam > 0 ? config.questionsPerExam : 30;
    const count = Math.min(targetCount, indices.length);
    chosenIndices = indices.slice(0, count);
  }

  const chosenQuestions = chosenIndices.map(idx => {
    const orig = allQs[idx];
    // Cloner la question pour ne pas modifier l'original
    const qClone = JSON.parse(JSON.stringify(orig)) as FormationQuestion;

    // Mélanger les options si c'est un QCU ou QCM et que l'option est activée
    if (config.shuffleOptions && qClone.o && qClone.o.length > 2 && (qClone.type === 'single' || qClone.type === 'multi')) {
      const optPairs = qClone.o.map((opt, i) => ({ opt, origIdx: i }));
      for (let i = optPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optPairs[i], optPairs[j]] = [optPairs[j], optPairs[i]];
      }
      qClone.o = optPairs.map(p => p.opt);

      if (qClone.type === 'single') {
        const newCorrectIdx = optPairs.findIndex(p => p.origIdx === orig.a);
        qClone.a = newCorrectIdx;
      } else if (qClone.type === 'multi' && Array.isArray(orig.a)) {
        const oldCorrectSet = new Set(orig.a as number[]);
        const newCorrectArray: number[] = [];
        optPairs.forEach((p, newIdx) => {
          if (oldCorrectSet.has(p.origIdx)) {
            newCorrectArray.push(newIdx);
          }
        });
        qClone.a = newCorrectArray;
      }
    }

    return qClone;
  });

  return {
    questions: chosenQuestions,
    originalIndices: chosenIndices
  };
}
