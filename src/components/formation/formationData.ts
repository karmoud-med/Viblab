// Parcours Certification Vibrations Industrielles
// Modules, banques de questions complètes et pièges de terrain
// Types : 'single' (a = index), 'multi' (a = [index]), 'num' (a = valeur, tol = tolérance)
// Outils : 'iso' | 'conv' | 'freq' | 'brg' | 'bal'
import banqueData from './banque_questions_analyse_vibratoire_v2.json';

export const PASS = 85;

export type QuestionType = 'single' | 'multi' | 'num';
export type QuestionDifficulty = 'standard' | 'piege' | 'avance' | 'facile' | 'moyen' | 'difficile';
export type QuestionGravity = 'mineure' | 'significative' | 'critique' | 'urgence_arret';

export interface QuestionBase {
  id?: string;
  t: string;
  type: QuestionType;
  e: string;
  hint?: string;
  tool?: 'iso' | 'conv' | 'freq' | 'brg' | 'bal';
  pre?: any;
  unit?: string;
  isTrap?: boolean;
  trapWarning?: string;
  difficulty?: QuestionDifficulty;
  category?: string;
  gravity?: QuestionGravity;
  enabled?: boolean;
  inKahoot?: boolean; // Spécifiquement sélectionné par l'admin pour le Kahoot Live
  image?: string; // URL ou image base64 pour illustrer la question
  imageUrl?: string; // Alias pour compatibilité
}

export interface QuestionSingle extends QuestionBase {
  type: 'single';
  o: string[];
  a: number;
}

export interface QuestionMulti extends QuestionBase {
  type: 'multi';
  o: string[];
  a: number[];
}

export interface QuestionNum extends QuestionBase {
  type: 'num';
  a: number;
  tol: number;
  unit: string;
  o?: string[];
}

export type FormationQuestion = QuestionSingle | QuestionMulti | QuestionNum;

export interface FormationModule {
  id: number;
  title: string;
  desc: string;
  min: number;
  plain?: boolean;
  qs: FormationQuestion[];
}

export interface ModuleConfig {
  id: number;
  title: string;
  desc: string;
  min: number;
  passScore: number;
  questionsPerExam: number;
  useExactSelection?: boolean; // Si activé, seules les questions explicitement activées par l'admin apparaissent (pas de tirage aléatoire)
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowCalc: boolean;
  timeLimitMin: number;
  showTrapBadgeDuringExam: boolean;
  // Configuration Kahoot Live spécifique au module
  kahootTimePerQuestion?: number;
  kahootQuestionCount?: number;
  kahootShuffle?: boolean;
  kahootOnlySelected?: boolean;
}

// 114 questions certifiantes et 56 pièges de diagnostic industriel
export const MODULES_DATA: FormationModule[] = banqueData.modules as unknown as FormationModule[];

// Configurations de modules associées
export const DEFAULT_CONFIGS_DATA: Record<number, ModuleConfig> = banqueData.configs as unknown as Record<number, ModuleConfig>;

// Alias pour compatibilité
export const MODULES = MODULES_DATA;
