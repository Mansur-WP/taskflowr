import { useState } from 'react';
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
  Clock,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { User, Task } from '../types.js';
import { AppLogo } from './AppLogo.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  tasks?: Task[];
  activeProject?: string;
  onSelectProject?: (project: string) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  darkMode,
  toggleDarkMode,
  mobileOpen,
  setMobileOpen,
  tasks = [],
  activeProject = 'all',
  onSelectProject
}: SidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'todos', label: 'Tasks', icon: CheckSquare },
    { id: 'focus', label: 'Pomodoro Timer', icon: Clock },
    { id: 'calendar', label: 'Calendar View', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile Settings', icon: UserIcon },
  ];

  // Derive projects list
  const defaultProjects = ['Work', 'Personal', 'Shopping', 'Health'];
  const derivedProjects = Array.from(new Set(tasks.map((t) => t.category || 'General')));
  const finalProjects = Array.from(new Set([...defaultProjects, ...derivedProjects])).filter(p => p && p.trim() !== '');

  const getProjectColor = (proj: string) => {
    const p = proj.toLowerCase();
    if (p.includes('work')) return '#6366f1'; // Indigo
    if (p.includes('personal')) return '#3b82f6'; // Blue
    if (p.includes('shop') || p.includes('buy')) return '#ec4899'; // Pink
    if (p.includes('health') || p.includes('well')) return '#10b981'; // Emerald
    if (p.includes('school') || p.includes('study')) return '#8b5cf6'; // Violet
    return '#f59e0b'; // Amber
  };

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : 'US';
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between p-4 glass-panel-heavy text-gray-700 dark:text-gray-300 border-r border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#09051d]/95 backdrop-blur-xl transition-colors">
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-none mb-4 min-h-0">
        {/* Header Branding */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 sticky top-0 bg-white/80 dark:bg-[#09051d]/95 backdrop-blur-md z-10">
          <AppLogo className="w-11 h-11 hover:scale-105 active:scale-95 transition-transform" />
          <div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white block tracking-tight font-display">TaskFlowr</span>
            <span className="text-[10px] text-[#8b5cf6] dark:text-[#06b6d4] font-mono tracking-widest uppercase font-semibold">Workspace V1</span>
          </div>
        </div>

        {/* Navigation Elements */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id && activeProject === 'all';
            return (
               <button
                key={item.id}
                onClick={() => {
                  if (onSelectProject) onSelectProject('all');
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer relative ${
                  isActive 
                    ? 'text-gray-900 dark:text-white font-bold' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {/* Active Slider Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-[#8b5cf6]/10 via-[#6366f1]/10 to-[#06b6d4]/10 dark:from-[#8b5cf6]/20 dark:via-[#6366f1]/15 dark:to-[#06b6d4]/15 rounded-xl -z-10 border-l-4 border-l-[#8b5cf6] border border-slate-200 dark:border-white/5"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8b5cf6] dark:text-[#06b6d4]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* PROJECTS COLLAPSIBLE ACCORDION */}
        <div className="mt-8 px-2">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 hover:text-gray-600 dark:hover:text-slate-400 transition cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="font-display">Projects</span>
            </div>
            {projectsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {projectsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-hidden"
              >
                <button
                  onClick={() => {
                    if (onSelectProject) onSelectProject('all');
                    setCurrentTab('todos');
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer text-left ${
                    currentTab === 'todos' && activeProject === 'all'
                      ? 'bg-[#8b5cf6]/10 text-gray-950 dark:text-[#06b6d4]'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>All Projects</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </button>

                {finalProjects.map((proj) => {
                  const projColor = getProjectColor(proj);
                  const isSelected = currentTab === 'todos' && activeProject === proj;
                  const count = tasks.filter((t) => t.category === proj).length;

                  return (
                    <button
                      key={proj}
                      onClick={() => {
                        if (onSelectProject) onSelectProject(proj);
                        setCurrentTab('todos');
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#8b5cf6]/10 to-[#06b6d4]/10 text-gray-950 dark:text-[#06b6d4] border border-[#8b5cf6]/20'
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-[#8b5cf6] dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span 
                          className="w-2 h-2 rounded-full block shrink-0 animate-pulse" 
                          style={{ backgroundColor: projColor }} 
                        />
                        <span className="truncate">{proj}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Controls & User Widget */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
        {/* Dark Mode switcher */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition text-gray-500 dark:text-gray-400 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {darkMode ? <Sun className="w-3.5 h-3.5 text-[#3b82f6]" /> : <Moon className="w-3.5 h-3.5 text-[#6366f1]" />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10">
            ALT+D
          </span>
        </button>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
              style={{ backgroundColor: user.profile_color || '#6366f1' }}
            >
              {getInitials(user.username)}
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">
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
            className="p-1.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-gray-400 hover:text-rose-500 transition cursor-pointer shrink-0"
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
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 glass-panel-heavy text-gray-900 dark:text-white border-b border-white/20 dark:border-white/10 fixed top-0 left-0 right-0 z-30 transition-colors">
        <div className="flex items-center gap-2.5">
          <AppLogo className="w-8 h-8 hover:scale-105 active:scale-95 transition-transform" />
          <span className="font-bold text-md text-gray-900 dark:text-white tracking-tight font-display">TaskFlowr</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 border border-white/25 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 transition cursor-pointer"
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
