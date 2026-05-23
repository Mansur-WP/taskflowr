import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppLogo } from './AppLogo.js';

interface AuthViewProps {
  onAuthSuccess: (user: any, token?: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AuthView({ onAuthSuccess, toast }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Gmail Verification States
  const [gmailCode, setGmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');

  // Password validation checks
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const sendGmailCode = async () => {
    if (!email) {
      toast('Please enter your email address first', 'error');
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast('Please enter a valid email address', 'error');
      return;
    }

    setSendingCode(true);
    try {
      const resp = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ email, purpose: 'register' })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }
      setCodeSent(true);
      setSimulatedCode(data.code || '');
      toast('Gmail security safeguard: Verification code simulated!', 'success');
    } catch (err: any) {
      toast(err.message || 'Error occurred dispatching verification code.', 'error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isLogin) {
      if (username.trim().length < 3) {
        toast('Username must be at least 3 characters', 'error');
        return;
      }
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        toast('Please enter a valid email address', 'error');
        return;
      }
      if (!hasMinLength || !hasLetter || !hasNumber) {
        toast('Password does not satisfy safety rules', 'error');
        return;
      }
      if (password !== confirmPassword) {
        toast('Passwords do not match', 'error');
        return;
      }
      if (!gmailCode) {
        toast('Please request and enter your 6-digit Gmail verification code', 'error');
        return;
      }
    } else {
      if (!email || !password) {
        toast('Please enter credentials and password', 'error');
        return;
      }
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { identity: email, password }
      : { username, email, password, code: gmailCode };

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Authentication process failed');
      }

      toast(isLogin ? `Welcome back, ${data.user.username}!` : 'Account created successfully!', 'success');
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      toast(err.message || 'An error occurred during authentication', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    if (isLogin) {
      setEmail('demo@example.com');
      setPassword('demo1234');
      toast('Demo credentials auto-filled', 'info');
    } else {
      setUsername('DemoUser');
      setEmail('demo@example.com');
      setPassword('demo1234');
      setConfirmPassword('demo1234');
      toast('Demo registration data filled', 'info');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-8 relative overflow-hidden transition-colors">
      {/* Decorative Blur Background Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-505/20 blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        className="w-full max-w-md glass-panel p-2 rounded-3xl shadow-xl border-white/5 overflow-hidden"
      >
        <div className="p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <AppLogo className="w-14 h-14 hover:scale-105 transition-transform" />
            </div>
            <h1 id="auth-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              {isLogin ? 'Sign In to TaskFlowr' : 'Create an Account'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              {isLogin ? 'Manage your priorities, calendars & analytics' : 'Start organizing your tasks like a pro today'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Username FIELD for Sign Up */}
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/25 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. janesmith"
                  />
                </div>
              </div>
            )}

            {/* Email / Identity FIELD */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                {isLogin ? 'Username or Email' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type={isLogin ? "text" : "email"}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/25 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  placeholder={isLogin ? "demo@example.com or DemoUser" : "name@example.com"}
                />
              </div>
            </div>

            {/* Password FIELD */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/25 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password FIELD for Sign Up */}
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/25 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Password Health / Rules Checklist */}
            {!isLogin && password.length > 0 && (
              <div className="p-3 bg-white/10 dark:bg-black/15 rounded-xl text-xs space-y-1.5 border border-indigo-500/10">
                <p className="font-semibold text-gray-600 dark:text-gray-300">Password Requirements:</p>
                <div className="flex items-center gap-1.5 text-gray-500">
                  {hasMinLength ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1 shrink-0" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-600 line-through' : ''}>At least 6 characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  {hasLetter ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1 shrink-0" />
                  )}
                  <span className={hasLetter ? 'text-emerald-600 line-through' : ''}>Contains a letter</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  {hasNumber ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-1 shrink-0" />
                  )}
                  <span className={hasNumber ? 'text-emerald-600 line-through' : ''}>Contains a digit</span>
                </div>
              </div>
            )}

            {/* GMAIL SAFEGUARD VERIFICATION PANEL */}
            {!isLogin && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                    Gmail Verification
                  </span>
                  <button
                    type="button"
                    disabled={sendingCode || !email}
                    onClick={sendGmailCode}
                    className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider hover:underline transition select-none disabled:opacity-50 cursor-pointer"
                  >
                    {sendingCode ? 'Dispatching...' : codeSent ? 'Resend Code' : 'Send Code'}
                  </button>
                </div>

                {codeSent ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                      We simulated sending a 6-digit confirmation code to your registered Gmail address.
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={gmailCode}
                      onChange={(e) => setGmailCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full tracking-[0.25em] text-center py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white text-base font-bold focus:outline-none focus:border-indigo-500"
                      placeholder="000000"
                    />
                    
                    {simulatedCode && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Simulated Gmail Alert: Code is <b className="font-extrabold select-all underline">{simulatedCode}</b>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-normal">
                    Please trigger code dispatch to verify ownership of your Gmail account securely before finalizing authorization.
                  </p>
                )}
              </div>
            )}

            {/* Submit AUTH */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-indigo-500 active:scale-98 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Assist */}
          <div className="relative flex py-4 items-center animate-fade-in">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[10px] text-gray-400 uppercase tracking-widest font-mono">Quick Access</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button
            type="button"
            onClick={fillDemoAccount}
            className="w-full py-2.5 bg-slate-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
            Auto-fill Demo Account Details
          </button>
        </div>

        {/* Auth Toggle Footers */}
        <div className="px-8 py-4 bg-white/5 dark:bg-white/5 border-t border-white/10 text-center text-xs text-gray-500 dark:text-slate-400">
          {isLogin ? "Don't have an account yet?" : "Already registered?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              toast(isLogin ? "Let's register an account" : "Switching to Login screen", "info");
            }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer ml-1"
          >
            {isLogin ? 'Create one now' : 'Sign in here'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
