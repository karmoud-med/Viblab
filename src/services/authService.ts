import { User, UserRole } from '../types/course';
import { getUserByUsername, updateLastLogin, logAuditAction } from './sqliteDatabase';

const AUTH_STORAGE_KEY = 'viblab_current_user_session';
const VIEW_MODE_KEY = 'viblab_active_view_mode';

export type ViewMode = 'admin' | 'formateur' | 'eleve';

export interface AuthSession {
  user: User;
  token: string;
  loginTimestamp: string;
}

// Event dispatcher for reactive updates across components
type AuthListener = (user: User | null, viewMode: ViewMode) => void;
const listeners: Set<AuthListener> = new Set();

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyAuthChange(): void {
  const current = getCurrentUser();
  const mode = getActiveViewMode();
  listeners.forEach((fn) => fn(current, mode));
}

/**
 * Get the currently logged-in user from session storage
 */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    return session.user;
  } catch (err) {
    return null;
  }
}

/**
 * Get active view mode: 'admin', 'formateur', or 'eleve'
 */
export function getActiveViewMode(): ViewMode {
  try {
    const mode = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (mode === 'admin' || mode === 'formateur' || mode === 'eleve') {
      const user = getCurrentUser();
      if (!user) return 'eleve';
      // If user is eleve, they cannot be in admin or formateur view
      if (user.role === 'eleve') return 'eleve';
      return mode;
    }
  } catch (err) {}
  
  const user = getCurrentUser();
  if (user) {
    return user.role;
  }
  return 'eleve';
}

/**
 * Switch view mode between 'admin', 'formateur', and 'eleve'
 */
export function setActiveViewMode(mode: ViewMode): boolean {
  const user = getCurrentUser();
  if (mode === 'admin' && (!user || user.role !== 'admin')) {
    return false; // Unauthorized
  }
  if (mode === 'formateur' && (!user || (user.role !== 'admin' && user.role !== 'formateur'))) {
    return false; // Unauthorized
  }
  localStorage.setItem(VIEW_MODE_KEY, mode);
  notifyAuthChange();
  return true;
}

/**
 * Perform login against SQLite database and automatically set orientation
 */
export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const record = await getUserByUsername(username.trim());
    if (!record) {
      return { success: false, error: "Identifiant incorrect ou utilisateur inexistant dans la base SQLite." };
    }

    if (!record.isActive) {
      return { success: false, error: "Ce compte utilisateur est verrouillé par l'administrateur. Accès refusé." };
    }

    // Password verification
    if (record.passwordHash !== password.trim()) {
      return { success: false, error: "Mot de passe incorrect. Veuillez vérifier votre saisie." };
    }

    const user: User = {
      id: record.id,
      username: record.username,
      fullName: record.fullName,
      email: record.email,
      role: record.role,
      isActive: record.isActive,
      createdAt: record.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    const session: AuthSession = {
      user,
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      loginTimestamp: new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

    // Automatically orient the view mode to match user role:
    // admin -> 'admin', formateur -> 'formateur', eleve -> 'eleve'
    localStorage.setItem(VIEW_MODE_KEY, user.role);

    await updateLastLogin(user.id);
    await logAuditAction(user.username, 'LOGIN_SUCCESS', 'auth', user.id, `Connexion réussie orientée vers la vue ${user.role}`);

    notifyAuthChange();
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur de connexion à la base de données SQLite." };
  }
}

/**
 * Perform logout and clear session
 */
export function logout(): void {
  const user = getCurrentUser();
  if (user) {
    logAuditAction(user.username, 'LOGOUT', 'auth', user.id, 'Déconnexion utilisateur — retour page de login');
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(VIEW_MODE_KEY);
  notifyAuthChange();
}

/**
 * Check if active session is authenticated as admin
 */
export function isAdminAuthenticated(): boolean {
  const user = getCurrentUser();
  return Boolean(user && user.role === 'admin');
}

/**
 * Check if active session is authenticated as formateur or admin
 */
export function canManageCourses(): boolean {
  const user = getCurrentUser();
  return Boolean(user && (user.role === 'admin' || user.role === 'formateur'));
}
