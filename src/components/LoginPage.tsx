import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Tv, 
  GraduationCap, 
  Lock, 
  User as UserIcon, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { login } from '../services/authService';
import { User } from '../types/course';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  theme: 'dark' | 'light' | 'mono';
  onCycleTheme: () => void;
}

type RoleType = 'admin' | 'trainer' | 'student';

export default function LoginPage({
  onLoginSuccess,
  theme,
  onCycleTheme
}: LoginPageProps) {
  // Active role selector
  const [selectedRole, setSelectedRole] = useState<RoleType>('trainer');

  // Credentials
  const [username, setUsername] = useState<string>('formateur');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // States
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoAccordeon, setShowDemoAccordeon] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const isLight = theme === 'light';

  // Role details metadata
  const roleConfig: Record<RoleType, {
    label: string;
    defaultUsername: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    btnText: string;
    demoPass: string;
  }> = {
    trainer: {
      label: 'Formateur',
      defaultUsername: 'formateur',
      icon: Tv,
      description: 'Animation en salle, projection des modules et corrigés officiels des QCM.',
      btnText: "Accéder à l'espace Formateur",
      demoPass: 'TrainerVibLab2026!'
    },
    admin: {
      label: 'Admin',
      defaultUsername: 'admin',
      icon: ShieldCheck,
      description: 'Supervision des modules, configuration des examens et gestion des comptes SQLite.',
      btnText: "Accéder à l'espace Administrateur",
      demoPass: 'AdminVibLab2026!'
    },
    student: {
      label: 'Élève',
      defaultUsername: 'eleve',
      icon: GraduationCap,
      description: "Parcours d'apprentissage, suivi de progression et passage des QCM de certification.",
      btnText: "Accéder à l'espace Élève",
      demoPass: 'StudentVibLab2026!'
    }
  };

  // Switch role and update default username if applicable
  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setErrorMessage(null);
    const prevDefault = roleConfig[selectedRole].defaultUsername;
    if (!username || username === prevDefault) {
      setUsername(roleConfig[role].defaultUsername);
    }
  };

  // Quick fill from demo credentials
  const handleQuickFill = (role: RoleType) => {
    setSelectedRole(role);
    setUsername(roleConfig[role].defaultUsername);
    setPassword(roleConfig[role].demoPass);
    setErrorMessage(null);
  };

  // Submit login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage("Veuillez saisir votre identifiant.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Veuillez saisir votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || "Identifiant ou mot de passe incorrect dans la base de données SQLite.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion à la base SQLite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans ${
      isLight ? 'bg-[#F6F5F1] text-[#1C2733]' : 'bg-[#070D18] text-[#E6EBF1]'
    }`}>
      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className={`w-full max-w-[1440px] rounded-2xl border overflow-hidden shadow-2xl transition-all ${
          isLight ? 'bg-white border-[#E3E1DA]' : 'bg-[#0B1422] border-[#1C2A3D]'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[820px]">
            
            {/* ================================================================= */}
            {/* LEFT SIDE : Brand panel with FFT spectrum and key statistics      */}
            {/* ================================================================= */}
            <div className="bg-[#0B1422] text-[#E6EBF1] p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1C2A3D]">
              
              {/* Brand Header with preserved official logo */}
              <div className="relative z-10">
                <div className="flex items-center gap-3.5">
                  {/* Preserved Official Vector Logo */}
                  <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="42" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="50" cy="50" r="28" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
                      <path d="M15 50 Q 32.5 15, 50 50 T 85 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 50 Q 32.5 85, 50 50 T 85 50" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                      <circle cx="50" cy="50" r="2.5" fill="#22c55e" className="animate-ping" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[17px] leading-none tracking-tight uppercase font-sans text-white">
                        VIB<span className="text-blue-400">LAB</span>
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white bg-[#DC2626] uppercase shadow-xs">
                        PRO
                      </span>
                    </div>
                    <span className="font-mono text-[9px] font-semibold text-[#8A97A8] tracking-[0.06em] uppercase mt-0.5">
                      OCP MAINTENANCE SOLUTIONS · ISO 18436
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Headline & Description */}
              <div className="my-8 lg:my-12 flex flex-col gap-4 relative z-10">
                <span className="font-mono text-xs font-semibold tracking-[0.14em] text-[#E8A317] uppercase">
                  SURVEILLANCE CONDITIONNELLE &amp; MAINTENANCE PRÉDICTIVE · ISO 18436
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-[-0.03em] leading-[1.08]">
                  Plateforme de formation &amp;<br />certification industrielle
                </h1>
                <p className="text-sm sm:text-base text-[#A9B4C2] leading-relaxed max-w-[480px]">
                  Parcours certifiants modulaires, simulateurs 3D interactifs, banques de QCM et ateliers pratiques : Analyse vibratoire (Niveaux 1 &amp; 2), Thermographie infrarouge et diagnostic prédictif des machines.
                </p>

                {/* Multi-discipline Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Vibrations Niveaux 1 &amp; 2
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Thermographie Infrarouge
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Maintenance Conditionnelle (CBM)
                  </span>
                </div>
              </div>

              {/* Stylized FFT Spectrum SVG with harmonic labels */}
              <div className="relative my-4 z-0 w-full h-[170px] sm:h-[195px] pointer-events-none select-none">
                <svg className="w-full h-full" viewBox="0 0 720 220" preserveAspectRatio="none" fill="none">
                  {/* Baseline grid */}
                  <path d="M0 219.5H720" stroke="#1C2A3D" strokeWidth="1" />
                  
                  {/* Subtle horizontal grid lines */}
                  <path d="M0 160H720" stroke="#1C2A3D" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
                  <path d="M0 100H720" stroke="#1C2A3D" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                  
                  {/* Amber vibration FFT spectrum line */}
                  <path 
                    d="M0 210 L40 206 L60 200 L72 120 L84 204 L120 202 L132 168 L144 203 L190 200 L204 60 L218 198 L260 200 L276 150 L290 199 L340 198 L354 110 L368 198 L420 201 L434 176 L448 200 L500 199 L514 140 L528 199 L580 202 L592 186 L604 202 L660 203 L672 190 L684 204 L720 206" 
                    stroke="#E8A317" 
                    strokeWidth="1.8" 
                    strokeLinejoin="round" 
                  />
                  {/* Spectrum Area fill */}
                  <path 
                    d="M0 210 L40 206 L60 200 L72 120 L84 204 L120 202 L132 168 L144 203 L190 200 L204 60 L218 198 L260 200 L276 150 L290 199 L340 198 L354 110 L368 198 L420 201 L434 176 L448 200 L500 199 L514 140 L528 199 L580 202 L592 186 L604 202 L660 203 L672 190 L684 204 L720 206 V220 H0Z" 
                    fill="#E8A317" 
                    fillOpacity="0.08" 
                  />
                </svg>

                {/* Spectral Harmonic Tags */}
                <div className="absolute left-[28%] bottom-[75%] font-mono text-[11px] font-semibold text-[#E8A317] bg-[#111D2E]/80 px-1.5 py-0.5 rounded border border-[#E8A317]/30">
                  1× (1485 RPM)
                </div>
                <div className="absolute left-[49%] bottom-[52%] font-mono text-[10.5px] font-medium text-[#8A97A8]">
                  2× (Harmonique)
                </div>
                <div className="absolute left-[70%] bottom-[40%] font-mono text-[10.5px] font-medium text-[#8A97A8]">
                  BPFO (Défaut bague)
                </div>
              </div>

              {/* Bottom Key Stats */}
              <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#1C2A3D] relative z-10">
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">Multi-niveaux</span>
                  <span className="text-xs text-[#8A97A8] font-medium">parcours modulaires</span>
                </div>
                <div className="flex flex-col pl-4 border-l border-[#1C2A3D]">
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">400+</span>
                  <span className="text-xs text-[#8A97A8] font-medium">questions &amp; cas réels</span>
                </div>
                <div className="flex flex-col pl-4 border-l border-[#1C2A3D]">
                  <span className="text-xl sm:text-2xl font-bold text-[#E8A317] tracking-tight">85 %</span>
                  <span className="text-xs text-[#8A97A8] font-medium">seuil d'examen</span>
                </div>
              </div>

            </div>

            {/* ================================================================= */}
            {/* RIGHT SIDE : Unified Login Form with Space Selector               */}
            {/* ================================================================= */}
            <div className={`p-8 sm:p-12 lg:p-14 flex flex-col justify-between ${
              isLight ? 'bg-white' : 'bg-[#0E1626]'
            }`}>
              
              {/* Top controls: Theme toggle */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCycleTheme}
                  className={`flex items-center gap-2 h-9 px-3.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    isLight 
                      ? 'border-[#E3E1DA] hover:bg-[#F6F5F1] text-[#5B6675]' 
                      : 'border-[#1C2A3D] hover:bg-[#13233A] text-[#A9B4C2]'
                  }`}
                  title="Changer de thème"
                >
                  {isLight ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-[#1F4E8C]" />
                      <span>Mode sombre</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[#E8A317]" />
                      <span>Mode clair</span>
                    </>
                  )}
                </button>
              </div>

              {/* Central Form Container */}
              <div className="w-full max-w-[420px] mx-auto my-auto py-8">
                
                {/* Heading */}
                <div className="flex flex-col gap-1.5 mb-7">
                  <h2 className={`text-2xl sm:text-3xl font-semibold tracking-[-0.02em] ${
                    isLight ? 'text-[#0F1B2D]' : 'text-white'
                  }`}>
                    Connexion
                  </h2>
                  <p className={`text-sm ${isLight ? 'text-[#5B6675]' : 'text-[#8A97A8]'}`}>
                    Choisissez votre espace puis saisissez vos identifiants.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  
                  {/* Role Selector */}
                  <div className="flex flex-col gap-2">
                    <label className={`text-xs font-medium ${isLight ? 'text-[#3A4552]' : 'text-[#A9B4C2]'}`}>
                      Espace de travail
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['admin', 'trainer', 'student'] as RoleType[]).map((r) => {
                        const config = roleConfig[r];
                        const Icon = config.icon;
                        const isSelected = selectedRole === r;

                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleSelectRole(r)}
                            className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left transition relative cursor-pointer ${
                              isSelected
                                ? isLight
                                  ? 'border-[#0F1B2D] bg-[#F6F5F1] text-[#0F1B2D] shadow-xs'
                                  : 'border-[#E8A317] bg-[#13233A] text-white shadow-xs'
                                : isLight
                                  ? 'border-[#D6D3CA] hover:border-[#B5B1A5] bg-white text-[#5B6675]'
                                  : 'border-[#1C2A3D] hover:border-[#2A3B52] bg-[#0B1422] text-[#8A97A8]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className={`w-4 h-4 ${
                                isSelected 
                                  ? isLight ? 'text-[#0F1B2D]' : 'text-[#E8A317]' 
                                  : 'text-[#8A929C]'
                              }`} />
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-[#E8A317]" />
                              )}
                            </div>
                            <span className="text-xs font-semibold leading-tight">
                              {config.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Role Description */}
                    <span className={`text-[12px] leading-relaxed mt-0.5 ${isLight ? 'text-[#5B6675]' : 'text-[#8A97A8]'}`}>
                      {roleConfig[selectedRole].description}
                    </span>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Username Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-xs font-medium ${isLight ? 'text-[#3A4552]' : 'text-[#A9B4C2]'}`}>
                      Identifiant
                    </label>
                    <div className={`flex items-center gap-2.5 h-[42px] px-3 rounded-lg border transition ${
                      isLight 
                        ? 'border-[#D6D3CA] bg-white focus-within:border-[#0F1B2D]' 
                        : 'border-[#1C2A3D] bg-[#0B1422] focus-within:border-[#E8A317]'
                    }`}>
                      <UserIcon className="w-4 h-4 text-[#8A929C] shrink-0" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Identifiant de compte..."
                        className={`w-full text-xs font-medium outline-none bg-transparent ${
                          isLight ? 'text-[#0F1B2D]' : 'text-white'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-medium ${isLight ? 'text-[#3A4552]' : 'text-[#A9B4C2]'}`}>
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs font-medium text-[#1F4E8C] hover:underline cursor-pointer"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className={`flex items-center gap-2.5 h-[42px] px-3 rounded-lg border transition ${
                      isLight 
                        ? 'border-[#D6D3CA] bg-white focus-within:border-[#0F1B2D]' 
                        : 'border-[#1C2A3D] bg-[#0B1422] focus-within:border-[#E8A317]'
                    }`}>
                      <Key className="w-4 h-4 text-[#8A929C] shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Saisissez votre mot de passe..."
                        className={`w-full text-xs font-mono outline-none bg-transparent ${
                          isLight ? 'text-[#0F1B2D]' : 'text-white'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#8A929C] hover:text-[#0F1B2D] dark:hover:text-white cursor-pointer transition shrink-0"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D6D3CA] text-[#0F1B2D] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className={`text-xs select-none cursor-pointer ${
                      isLight ? 'text-[#3A4552]' : 'text-[#A9B4C2]'
                    }`}>
                      Rester connecté sur ce poste de formation
                    </label>
                  </div>

                  {/* Submit Button (Single Navy/Amber Action Button) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-5 rounded-lg bg-[#0F1B2D] hover:bg-[#1C2E47] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{loading ? 'Vérification SQLite...' : roleConfig[selectedRole].btnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Demo Credentials Collapsible Accordeon */}
                  <div className="rounded-xl border border-[#F0D49A] bg-[#FDF6E7] overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setShowDemoAccordeon(!showDemoAccordeon)}
                      className="w-full flex items-center justify-between p-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#E8A317]/20 text-[#7A4A00]">
                          DÉMO
                        </span>
                        <span className="text-xs font-medium text-[#7A4A00]">
                          Identifiants de démonstration SQLite
                        </span>
                      </div>
                      {showDemoAccordeon ? (
                        <ChevronUp className="w-4 h-4 text-[#7A4A00]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#7A4A00]" />
                      )}
                    </button>

                    {showDemoAccordeon && (
                      <div className="p-3 pt-0 border-t border-[#F0D49A]/60 flex flex-col gap-2">
                        <p className="text-[11px] text-[#7A4A00]/80">
                          Cliquez sur un rôle pour pré-remplir automatiquement le formulaire avec les clés SQLite par défaut :
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {(['trainer', 'admin', 'student'] as RoleType[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleQuickFill(r)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-[#F0D49A] text-left transition cursor-pointer shadow-2xs"
                            >
                              <div className="text-[10.5px] font-bold text-[#0F1B2D]">
                                {roleConfig[r].label}
                              </div>
                              <div className="font-mono text-[9.5px] text-[#7A4A00] truncate">
                                {roleConfig[r].defaultUsername}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </form>

              </div>

              {/* Right Footer info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-[#E3E1DA] dark:border-[#1C2A3D] text-[11px] text-[#8A929C]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1E7A4F]" />
                  <span>Mots de passe chiffrés · base SQLite (sql.js)</span>
                </span>
                <span>© 2026 OCP Maintenance Solutions</span>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0B1422] rounded-2xl border border-[#E3E1DA] dark:border-[#1C2A3D] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DA] dark:border-[#1C2A3D]">
              <div className="flex items-center gap-2 text-[#0F1B2D] dark:text-white font-semibold text-sm">
                <HelpCircle className="w-4 h-4 text-[#E8A317]" />
                <span>Réinitialisation du mot de passe</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-[#8A929C] hover:text-[#0F1B2D] dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#5B6675] dark:text-[#A9B4C2] leading-relaxed">
              <p>
                Cette plateforme fonctionne avec une base de données locale sécurisée SQLite.
              </p>
              <p>
                Pour réinitialiser votre mot de passe, connectez-vous avec l'espace <strong>Administrateur</strong> pour accéder à la gestion des utilisateurs, ou utilisez les mots de passe de test fournis dans le panneau Démo.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0F1B2D] text-white text-xs font-medium cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
