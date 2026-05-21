import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  BarChart3, 
  User as UserIcon, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Clock
} from 'lucide-react';
import { User } from '../types.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  darkMode,
  toggleDarkMode,
  mobileOpen,
  setMobileOpen
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'todos', label: 'Tasks', icon: CheckSquare },
    { id: 'focus', label: 'Pomodoro Timer', icon: Clock },
    { id: 'calendar', label: 'Calendar View', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile Settings', icon: UserIcon },
  ];

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : 'US';
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between p-4 glass-panel-heavy text-gray-700 dark:text-gray-300 border-r border-white/20 dark:border-white/10 transition-colors">
      <div>
        {/* Header Branding */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-500/20">
            ✓
          </div>
          <div>
            <span className="font-bold text-lg text-gray-900 dark:text-white block tracking-tight">TaskFlowr</span>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono tracking-widest uppercase">Workspace V1</span>
          </div>
        </div>

        {/* Navigation Elements */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer relative ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm' 
                    : 'hover:bg-white/20 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {/* Active Slider Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-white/55 dark:bg-white/10 rounded-lg -z-10 border border-indigo-200/50 dark:border-white/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls & User Widget */}
      <div className="space-y-4 pt-4 border-t border-white/20 dark:border-white/10">
        {/* Dark Mode switcher */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition text-gray-500 dark:text-gray-400 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/40 dark:bg-white/10">
            ALT+D
          </span>
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/30 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
              style={{ backgroundColor: user.profile_color || '#6366f1' }}
            >
              {getInitials(user.username)}
            </div>
            <div className="truncate">
              <span className="block text-xs font-semibold text-gray-900 dark:text-white truncate">
                {user.username}
              </span>
              <span className="block text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {user.email}
              </span>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            title="Log out session"
            className="p-1.5 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-gray-400 hover:text-red-500 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persisted above md screens) */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile AppBar / Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel-heavy text-gray-900 dark:text-white border-b border-white/20 dark:border-white/10 fixed top-0 left-0 right-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-md font-bold shadow-sm shadow-indigo-500/10">
            ✓
          </div>
          <span className="font-bold text-md text-gray-900 dark:text-white tracking-tight">TaskFlowr</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 border border-white/20 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 transition cursor-pointer"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile Drawer (with slide-in animation overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* Backdrop click barrier */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black"
            />
            {/* Nav container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 bottom-0 left-0 w-64 shadow-2xl z-50 h-full"
            >
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
