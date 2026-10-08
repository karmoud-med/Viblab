import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Key, 
  Lock, 
  Unlock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Search, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Tv, 
  GraduationCap, 
  Terminal, 
  Clock, 
  Database,
  ArrowRight,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';
import { User, UserRole } from '../types/course';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../services/sqliteDatabase';

interface UserAccountManagerProps {
  theme: 'dark' | 'light' | 'mono';
  onClose?: () => void;
  isModalView?: boolean;
}

export default function UserAccountManager({
  theme,
  onClose,
  isModalView = false
}: UserAccountManagerProps) {
  const isLight = theme === 'light';
  const isBW = theme === 'mono';

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'formateur' | 'eleve'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);

  // Form State: Create/Edit
  const [formUsername, setFormUsername] = useState<string>('');
  const [formFullName, setFormFullName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('eleve');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formShowPassword, setFormShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State: Change Password
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const list = await getUsers();
      setUsersList(list);
    } catch (err: any) {
      showToast(`Erreur chargement utilisateurs: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = 
      !q || 
      u.username.toLowerCase().includes(q) || 
      u.fullName.toLowerCase().includes(q) || 
      (u.email && u.email.toLowerCase().includes(q));
    
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && u.isActive) || 
      (statusFilter === 'locked' && !u.isActive);

    return matchQuery && matchRole && matchStatus;
  });

  // Action: Open Create User Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormRole('eleve');
    setFormPassword('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Action: Open Edit User Modal
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormFullName(u.fullName);
    setFormEmail(u.email || '');
    setFormRole(u.role);
    setFormPassword('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Action: Open Change Password Modal
  const handleOpenPasswordModal = (u: User) => {
    setPasswordModalUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  // Submit: Create or Update User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formFullName.trim()) {
      setFormError('Le nom complet est obligatoire.');
      return;
    }

    if (!editingUser) {
      if (!formUsername.trim()) {
        setFormError("L'identifiant (username) est obligatoire.");
        return;
      }
      if (!formPassword.trim()) {
        setFormError('Le mot de passe initial est obligatoire.');
        return;
      }
      if (formPassword.trim().length < 4) {
        setFormError('Le mot de passe doit comporter au moins 4 caractères.');
        return;
      }

      try {
        await createUser({
          username: formUsername.trim(),
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          role: formRole
        });
        showToast(`🎉 Compte "@${formUsername.trim()}" créé avec succès dans SQLite !`, 'success');
        setIsCreateModalOpen(false);
        await refreshUsers();
      } catch (err: any) {
        setFormError(err.message || 'Impossible de créer le compte.');
      }
    } else {
      try {
        await updateUser(editingUser.id, {
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          role: formRole,
          password: formPassword.trim() ? formPassword.trim() : undefined
        });
        showToast(`✅ Informations du compte "@${editingUser.username}" mises à jour.`, 'success');
        setIsCreateModalOpen(false);
        await refreshUsers();
      } catch (err: any) {
        setFormError(err.message || 'Impossible de mettre à jour le compte.');
      }
    }
  };

  // Submit: Change Password
  const handleSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    setPasswordError(null);

    if (!newPassword.trim()) {
      setPasswordError('Veuillez saisir le nouveau mot de passe.');
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      await updateUser(passwordModalUser.id, {
        password: newPassword.trim()
      });
      showToast(`🔑 Mot de passe de "@${passwordModalUser.username}" modifié avec succès dans SQLite !`, 'success');
      setPasswordModalUser(null);
    } catch (err: any) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe.');
    }
  };

  // Action: Toggle Account Lock (Verrouiller / Déverrouiller)
  const handleToggleLock = async (u: User) => {
    if (u.username === 'admin') {
      showToast('Le compte administrateur principal ne peut pas être verrouillé.', 'error');
      return;
    }

    const nextState = !u.isActive;
    try {
      await updateUser(u.id, {
        isActive: nextState
      });
      showToast(
        nextState 
          ? `🔓 Compte "@${u.username}" déverrouillé (accès autorisé).` 
          : `🔒 Compte "@${u.username}" verrouillé (accès bloqué).`,
        nextState ? 'success' : 'info'
      );
      await refreshUsers();
    } catch (err: any) {
      showToast(`Erreur: ${err.message}`, 'error');
    }
  };

  // Action: Delete User
  const handleDeleteUser = async (u: User) => {
    if (u.username === 'admin') {
      showToast('Le compte administrateur principal ne peut pas être supprimé.', 'error');
      return;
    }

    if (!confirm(`Supprimer définitivement le compte utilisateur "@${u.username}" de la base SQLite ?`)) {
      return;
    }

    try {
      await deleteUser(u.id);
      showToast(`🗑️ Compte "@${u.username}" supprimé de la base SQLite.`, 'success');
      await refreshUsers();
    } catch (err: any) {
      showToast(`Erreur suppression: ${err.message}`, 'error');
    }
  };

  const activeCount = usersList.filter((u) => u.isActive).length;
  const lockedCount = usersList.filter((u) => !u.isActive).length;

  return (
    <div className={`space-y-6 ${isModalView ? 'p-2' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs font-medium border bg-[#0F1B2D] text-white border-[#2A3B52]">
          <CheckCircle2 className="w-4 h-4 text-[#E8A317] shrink-0" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header and Statistics Cards */}
      <div className="p-5 rounded-xl border border-[#E3E1DA] bg-white shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F0EFEA] border border-[#E3E1DA] flex items-center justify-center text-[#0F1B2D] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#5B6675]">
                  BASE SQLITE ACTIVE · TABLE USERS
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#0F1B2D] m-0">
                Comptes et utilisateurs
              </h2>
              <p className="text-xs text-[#5B6675] m-0 mt-0.5">
                Créez, modifiez, changez les mots de passe et gérez les rôles d'accès enregistrés dans SQLite.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={refreshUsers}
              disabled={isLoading}
              className="h-[36px] w-[36px] rounded-md border border-[#D6D3CA] bg-white hover:bg-[#FAF9F6] text-[#5B6675] hover:text-[#0F1B2D] flex items-center justify-center cursor-pointer transition-colors"
              title="Actualiser la liste SQLite"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="h-[36px] px-3.5 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white font-medium text-[13px] rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un compte</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="h-[36px] w-[36px] rounded-md border border-[#D6D3CA] bg-white hover:bg-[#FAF9F6] text-[#5B6675] hover:text-[#0F1B2D] flex items-center justify-center cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#FAF9F6] border border-[#E3E1DA] rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#EEECE6]">
          <div className="p-3 text-center">
            <span className="text-[10px] font-mono font-medium uppercase text-[#5B6675] block">Total comptes</span>
            <span className="text-[20px] font-semibold text-[#0F1B2D]">{usersList.length}</span>
          </div>

          <div className="p-3 text-center">
            <span className="text-[10px] font-mono font-medium uppercase text-[#5B6675] block">Déverrouillés (actifs)</span>
            <span className="text-[20px] font-semibold text-[#1E7A4F]">{activeCount}</span>
          </div>

          <div className="p-3 text-center">
            <span className="text-[10px] font-mono font-medium uppercase text-[#5B6675] block">Verrouillés (bloqués)</span>
            <span className="text-[20px] font-semibold text-[#8A929C]">{lockedCount}</span>
          </div>

          <div className="p-3 text-center">
            <span className="text-[10px] font-mono font-medium uppercase text-[#5B6675] block">Rôles configurés</span>
            <span className="text-xs font-mono font-medium text-[#0F1B2D] mt-1 block">
              {usersList.filter(u => u.role === 'admin').length} Admin · {usersList.filter(u => u.role === 'formateur').length} Form. · {usersList.filter(u => u.role === 'eleve').length} Élève
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A929C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, identifiant, email..."
              className="w-full h-[38px] pl-9 pr-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-medium text-[#0F1B2D] outline-none cursor-pointer"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="formateur">Formateurs</option>
              <option value="eleve">Élèves</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-medium text-[#0F1B2D] outline-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Déverrouillés uniquement</option>
              <option value="locked">Verrouillés uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-xl border border-[#E3E1DA] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E3E1DA] bg-[#FAF9F6] text-[10px] uppercase font-semibold text-[#5B6675]">
                <th className="p-3 pl-5">Compte utilisateur</th>
                <th className="p-3">Rôle & Espace</th>
                <th className="p-3">Statut sécurité</th>
                <th className="p-3">Email</th>
                <th className="p-3">Dernière connexion</th>
                <th className="p-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEECE6]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8A929C] font-medium">
                    Aucun compte utilisateur ne correspond à votre filtre.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr 
                      key={u.id}
                      className={`transition-colors hover:bg-[#FAF9F6] text-[#1C2733] ${
                        !u.isActive ? 'opacity-60 bg-[#FEF3F2]/40' : ''
                      }`}
                    >
                      {/* User Info */}
                      <td className="p-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-[#F0EFEA] border border-[#E3E1DA] flex items-center justify-center text-[#0F1B2D] shrink-0 font-mono text-xs font-bold">
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[13px] text-[#0F1B2D]">{u.fullName}</div>
                            <div className="text-[11px] font-mono text-[#5B6675]">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-sm inline-flex items-center gap-1 font-mono ${
                          u.role === 'admin'
                            ? 'bg-[#F0EFEA] text-[#0F1B2D] border border-[#E3E1DA]'
                            : (u.role === 'formateur' ? 'bg-[#FDF0D3] text-[#7A4A00] border border-[#F0D49A]' : 'bg-[#E3F1E9] text-[#1E7A4F] border border-[#BDE3CC]')
                        }`}>
                          <span>{u.role.toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Lock / Unlock Status */}
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleLock(u)}
                          disabled={u.username === 'admin'}
                          title={u.isActive ? "Cliquer pour verrouiller le compte" : "Cliquer pour déverrouiller le compte"}
                          className={`h-7 px-2.5 rounded-md text-[11.5px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                            u.isActive
                              ? 'bg-white text-[#1E7A4F] border-[#BDE3CC] hover:bg-[#E3F1E9]'
                              : 'bg-white text-[#B42318] border-[#FDA29B] hover:bg-[#FEF3F2]'
                          } ${u.username === 'admin' ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {u.isActive ? (
                            <>
                              <Unlock className="w-3 h-3 text-[#1E7A4F]" />
                              <span>Actif</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-[#B42318]" />
                              <span>Verrouillé</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Email */}
                      <td className="p-3 font-mono text-[11px] text-[#5B6675]">
                        {u.email || '—'}
                      </td>

                      {/* Last Login */}
                      <td className="p-3 font-mono text-[11px] text-[#5B6675]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Change Password */}
                          <button
                            onClick={() => handleOpenPasswordModal(u)}
                            className="p-1.5 rounded text-[#5B6675] hover:text-[#0F1B2D] hover:bg-[#F0EFEA] cursor-pointer transition-colors"
                            title="Changer le mot de passe"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded text-[#5B6675] hover:text-[#0F1B2D] hover:bg-[#F0EFEA] cursor-pointer transition-colors"
                            title="Modifier les informations"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.username === 'admin'}
                            className={`p-1.5 rounded text-[#8A929C] hover:text-[#B42318] hover:bg-[#F0EFEA] transition-colors ${
                              u.username === 'admin' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title={u.username === 'admin' ? "L'administrateur principal ne peut pas être supprimé" : "Supprimer définitivement"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE OR EDIT USER                             */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1B2D]/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#E3E1DA] bg-white text-[#1C2733] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#EEECE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0F1B2D]" />
                <h3 className="text-[15px] font-semibold text-[#0F1B2D]">
                  {editingUser ? `Modifier @${editingUser.username}` : 'Créer un compte utilisateur'}
                </h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-md bg-[#FEF3F2] border-l-2 border-[#B42318] text-[#B42318] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Nom complet :</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="ex: Rachid Bensalah"
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Identifiant (username) :</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  disabled={Boolean(editingUser)}
                  placeholder="ex: rbensalah"
                  className={`w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D] ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Email :</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ex: rachid@ocpms.ma"
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas modifier) :' : 'Mot de passe initial (dans SQLite) :'}
                </label>
                <div className="relative">
                  <input
                    type={formShowPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'Mot de passe sécurisé'}
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D] pr-10"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setFormShowPassword(!formShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A929C] hover:text-[#0F1B2D] cursor-pointer"
                  >
                    {formShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Rôle d'accès :</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-medium text-[#0F1B2D] outline-none cursor-pointer"
                >
                  <option value="eleve">🎓 Élève (Accès au parcours certifiant & QCM)</option>
                  <option value="formateur">👨‍🏫 Formateur (Cockpit d'animation, projection, corrigés)</option>
                  <option value="admin">🛡️ Administrateur (Gestion totale, modules HTML, SQLite)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-[36px] px-3.5 text-[13px] font-medium text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-4 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white text-[13px] font-medium rounded-md shadow-2xs cursor-pointer transition-colors"
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Créer dans SQLite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CHANGE PASSWORD SPECIFIC MODAL                   */}
      {/* ========================================================= */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1B2D]/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#E3E1DA] bg-white text-[#1C2733] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#EEECE6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0F1B2D]" />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0F1B2D]">
                    Changer le mot de passe
                  </h3>
                  <span className="text-[11px] text-[#5B6675] font-mono">
                    @{passwordModalUser.username} ({passwordModalUser.fullName})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setPasswordModalUser(null)}
                className="p-1 rounded text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPasswordChange} className="p-5 space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-3 rounded-md bg-[#FEF3F2] border-l-2 border-[#B42318] text-[#B42318] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Nouveau mot de passe :</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Saisissez le nouveau mot de passe..."
                    className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A929C] hover:text-[#0F1B2D] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1 text-[#3A4552]">Confirmer le mot de passe :</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le nouveau mot de passe..."
                  className="w-full h-[38px] px-3 rounded-md border border-[#D6D3CA] bg-white text-[13px] font-mono text-[#0F1B2D] outline-none focus:border-[#0F1B2D]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="h-[36px] px-3.5 text-[13px] font-medium text-[#5B6675] hover:text-[#0F1B2D] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-[36px] px-4 bg-[#0F1B2D] hover:bg-[#1a2d47] text-white text-[13px] font-medium rounded-md shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enregistrer dans SQLite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
