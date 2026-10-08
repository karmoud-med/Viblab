export interface CourseChapter {
  num: string;
  title: string;
  duration: string;
}

export interface CourseModule {
  id: string;
  courseId?: string;
  title: string;
  subtitle: string;
  type: 'html' | 'builtin';
  htmlContent?: string;
  htmlUrl?: string;
  htmlPath?: string;
  trainerNotes: string;
  visualDemoType?: 'waveform' | 'spectrum' | 'sensor_placement' | 'iso_table' | 'bearing_anatomy' | 'defect_chart';
  dateAdded?: string;
  createdAt?: string;
  dateUpdated?: string;
  updatedAt?: string;
  updatedBy?: string;
  author?: string;
  password?: string;
  accessCode?: string;
  orderIndex?: number;
  durationMin?: number;
  isStandalone?: boolean;
}

export interface CourseData {
  id: string;
  title: string;
  subtitle?: string;
  desc: string;
  badge: string;
  color: string;
  duration: string;
  target: string;
  prerequisites: string;
  objectives: string[];
  chapters: CourseChapter[];
  modules: CourseModule[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isPublished?: boolean;
}

export interface SecuritySettings {
  antiInspection: boolean;
  antiScreenBlur: boolean;
  antiPrint: boolean;
  watermarkEnabled: boolean;
  watermarkUser: string;
  watermarkOpacity?: number; // e.g. 0.04 to 0.15
  watermarkIntensity?: 'discreet' | 'medium' | 'high';
  antiScreenRecording?: boolean;
  antiSnippingTool?: boolean;
}

export type UserRole = 'admin' | 'formateur' | 'eleve';

export interface User {
  id: string;
  username: string;
  passwordHash?: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  completed: boolean;
  progressPercent: number;
  lastSlideIndex: number;
  lastViewedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export type AttendanceStatus = 'present' | 'retard' | 'absent_justifie' | 'absent_injustifie' | 'non_pointe';

export interface SessionPartDay {
  dayIndex: number;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM/YYYY
  label: string; // "Jour 1", "Jour 2", etc.
}

export interface SessionPart {
  partNumber: number;
  title: string; // e.g. "Partie 1 (3 Jours)"
  startDate: string;
  endDate: string;
  daysCount: number;
  days: SessionPartDay[];
}

export interface TrainingSession {
  id: string;
  sessionCode: string;
  title: string;
  courseId: string;
  companyName: string; // "MAGHREB STEEL"
  actionTheme: string; // "Analyse des vibrations niveau 1"
  trainerName: string;
  siteLocation: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'planned' | 'in_progress' | 'completed' | 'archived';
  isMultiPart?: boolean;
  parts?: SessionPart[];
  description?: string;
  createdAt: string;
}

export interface SessionTrainee {
  id: string;
  sessionId: string;
  userId?: string;
  fullName: string;
  matricule: string;
  cin?: string; // N° CIN (e.g. BJ218263)
  cnss?: string; // N° CNSS (e.g. 164591061)
  csp?: 'C' | 'E' | 'O'; // C: Cadre - E: Employé - O: Ouvrier
  jobTitle: string;
  siteEntity: string;
  email: string;
  phone?: string;
  accessCode: string;
  courseAccessGranted: boolean;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  traineeId: string;
  dayIndex: number;
  date: string;
  slot: 'matin' | 'apres_midi';
  status: AttendanceStatus;
  arrivalTime?: string;
  comment?: string;
  markedBy: string;
  markedAt: string;
}

export interface UserQuizResult {
  id: string;
  userId: string;
  moduleId: string;
  moduleNumber: number;
  bestScore: number;
  attempts: number;
  passed: boolean;
  lastAttemptAt: string;
  passedAt?: string;
}

export interface UserCourseStatus {
  id: string;
  userId: string;
  courseId: string;
  status: 'non_commence' | 'en_cours' | 'termine_valide' | 'echoue';
  progressPercent: number;
  modulesCompleted: number;
  totalModules: number;
  averageQuizScore: number;
  examScore?: number;
  certified: boolean;
  certifiedAt?: string;
  lastActivityAt: string;
}

export interface UserLearningSummary {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  matricule?: string;
  sessionId?: string;
  sessionCode?: string;
  sessionTitle?: string;
  // Attendance metrics in DB
  totalExpectedSlots: number;
  presentSlots: number;
  attendanceRate: number; // 0-100 %
  lastAttendanceDate?: string;
  // Course completion metrics in DB
  courseStatus: 'non_commence' | 'en_cours' | 'termine_valide' | 'echoue';
  progressPercent: number; // 0-100 %
  modulesCompleted: number;
  totalModules: number;
  averageQuizScore: number;
  certified: boolean;
  certifiedAt?: string;
  hasPassedCourse: boolean;
}

