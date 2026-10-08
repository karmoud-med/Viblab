import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Key, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Database,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { login } from '../services/authService';
import { User as UserType } from '../types/course';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  theme: 'dark' | 'light' | 'mono';
  initialRole?: 'admin' | 'formateur' | 'eleve';
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
  theme,
  initialRole = 'admin'
}: AdminLoginModalProps) {
  const [username, setUsername] = useState<string>(initialRole === 'admin' ? 'admin' : (initialRole === 'formateur' ? 'formateur' : 'eleve'));
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  const handleFillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(username, password);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMessage(res.error || "Identifiants invalides.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all transform scale-100 ${
          isLight 
            ? 'bg-white border-slate-300 text-slate-900' 
            : (isBW ? 'bg-slate-900 border-slate-700 text-white' : 'bg-[#0E1626] border-slate-800 text-slate-100')
        }`}
      >
        {/* Header with gradient badge */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center shadow-md ${
              isLight 
                ? 'bg-blue-600 text-white border-blue-500' 
                : 'bg-blue-600/20 text-blue-400 border-blue-500/40'
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Authentification SQLite
              </h3>
              <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Connexion sécurisée aux profils VibLab Pro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Fill Credentials */}
          <div className="space-y-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Comptes de démonstration (Cliquez pour pré-remplir) :
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin', 'AdminVibLab2026!')}
                className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${
                  username === 'admin'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' 
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <div className="font-black">Admin</div>
                <div className="text-[9px] opacity-75">Gestion & SQL</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('formateur', 'Trainer2026@')}
                className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${
                  username === 'formateur'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' 
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <div className="font-black">Formateur</div>
                <div className="text-[9px] opacity-75">Cours & Notes</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('eleve', 'Eleve2026@')}
                className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${
                  username === 'eleve'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200' 
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <div className="font-black">Élève</div>
                <div className="text-[9px] opacity-75">Lecteur Diapos</div>
              </button>
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <label className={`text-xs font-bold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Identifiant / Utilisateur
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: admin, formateur, eleve"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className={`text-xs font-bold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Mot de passe
            </label>
            <div className="relative">
              <Key className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${
                  isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SQLite Info Note */}
          <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
            isLight ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Database className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Vérification instantanée dans la base locale SQLite (table <code className="font-mono font-bold">users</code>).</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Connexion en cours...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
