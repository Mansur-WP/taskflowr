import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Lock, 
  Palette, 
  Check, 
  ShieldAlert, 
  FileCheck2,
  Trash2,
  Bookmark
} from 'lucide-react';
import { User } from '../types.js';

interface ProfileViewProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProfileView({
  user,
  onProfileUpdate,
  toast
}: ProfileViewProps) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileColor, setProfileColor] = useState(user.profile_color || '#3b82f6');

  const colorPalette = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899'  // pink
  ];

  // Password structural indicators
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (username.trim().length < 3) {
      toast('Username must be at least 3 characters', 'error');
      return;
    }

    if (password) {
      if (!hasMinLength || !hasLetter || !hasNumber) {
        toast('New password is too weak', 'error');
        return;
      }
      if (password !== confirmPassword) {
        toast('Passwords do not match', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password ? password : undefined,
          profile_color: profileColor
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed updating profile settings');
      }

      onProfileUpdate(data.user);
      setPassword('');
      setConfirmPassword('');
      toast('Profile preferences successfully updated!', 'success');
    } catch (err: any) {
      toast(err.message || 'Error occurred updating profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Intro visual banner card */}
      <div className="glass-panel p-6 rounded-2xl shadow-md border-white/5 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0 transition-colors duration-300 animate-pulse"
          style={{ backgroundColor: profileColor }}
        >
          {username ? username.slice(0, 2).toUpperCase() : 'US'}
        </div>

        <div className="space-y-1 text-center sm:text-left min-w-0">
          <h2 className="text-md font-bold text-gray-900 dark:text-white truncate">Profile Control Station</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Account Email: <span className="font-semibold">{user.email}</span>
          </p>
          <span className="text-[10px] font-mono text-gray-400 block pt-0.5">
            Registered: {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Main preferences form card */}
      <form onSubmit={handleSubmitProfile} className="glass-panel p-6 rounded-2xl shadow-sm border-white/5 space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-white/10 pb-2 flex items-center gap-1.5 font-mono">
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          General Preferences
        </h2>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest font-mono">
            Modify Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-indigo-500/20 dark:border-white/10 bg-white/10 dark:bg-black/15 text-gray-900 dark:text-gray-100 focus:outline-none"
              placeholder="Username..."
            />
          </div>
        </div>

        {/* Color themes accent choice */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest font-mono">
            Avatar Theme Choice
          </label>
          <div className="flex flex-wrap gap-2.5">
            {colorPalette.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setProfileColor(col)}
                className="w-7 h-7 rounded-lg border-2 border-transparent hover:scale-105 active:scale-95 transition flex items-center justify-center shadow-xs cursor-pointer"
                style={{ backgroundColor: col }}
              >
                {profileColor === col && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Password revision */}
        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-white/10 pb-2 flex items-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            Security & Password Upgrade
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest font-mono">
                New Upgrade Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-indigo-500/20 dark:border-white/10 bg-white/10 dark:bg-black/15 text-gray-900 dark:text-gray-100 focus:outline-none"
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest font-mono">
                Confirm Upgrade Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-indigo-500/20 dark:border-white/10 bg-white/10 dark:bg-black/15 text-gray-900 dark:text-gray-100 focus:outline-none"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          {password.length > 0 && (
            <div className="p-3 bg-white/10 dark:bg-black/15 border border-indigo-500/10 rounded-xl text-xs space-y-1">
              <span className="font-semibold block text-gray-600 dark:text-gray-300">New Password Audit Checklist:</span>
              <div className="flex items-center gap-2 text-gray-500">
                {hasMinLength ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-1 h-1 rounded-full bg-gray-400 mx-1 shrink-0" />}
                <span className={hasMinLength ? 'text-emerald-600 line-through' : ''}>Min 6 characters</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                {hasLetter ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-1 h-1 rounded-full bg-gray-400 mx-1 shrink-0" />}
                <span className={hasLetter ? 'text-emerald-600 line-through' : ''}>Requires letters</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                {hasNumber ? <Check className="w-3 h-3 text-emerald-500" /> : <div className="w-1 h-1 rounded-full bg-gray-400 mx-1 shrink-0" />}
                <span className={hasNumber ? 'text-emerald-600 line-through' : ''}>Requires numbers</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions Button */}
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Bookmark className="w-3.5 h-3.5" />
            {loading ? 'Saving preferences...' : 'Apply Config Preferences'}
          </button>
        </div>
      </form>

    </div>
  );
}
