import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Settings, 
  User as UserIcon, 
  CheckCircle, 
  X, 
  Info, 
  AlertCircle 
} from 'lucide-react';

import { User, Task } from './types.js';
import AuthView from './components/AuthView.js';
import Sidebar from './components/Sidebar.js';
import DashboardView from './components/DashboardView.js';
import TaskListView from './components/TaskListView.js';
import CalendarView from './components/CalendarView.js';
import AnalyticsView from './components/AnalyticsView.js';
import ProfileView from './components/ProfileView.js';
import FocusTimerView from './components/FocusTimerView.js';
import TaskDetailModal from './components/TaskDetailModal.js';

interface ToastAlert {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeProjectFilter, setActiveProjectFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global Toast Lists
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  // Preference state for auto-deleting completed tasks when all tasks are complete
  const [autoDeleteOnFinish, setAutoDeleteOnFinish] = useState(() => {
    return localStorage.getItem('auto_delete_on_finish') === 'true';
  });

  const toggleAutoDeleteOnFinish = () => {
    const nextVal = !autoDeleteOnFinish;
    setAutoDeleteOnFinish(nextVal);
    localStorage.setItem('auto_delete_on_finish', String(nextVal));
    triggerToast(
      nextVal 
        ? 'Auto-delete on finish all enabled! Compiling tasks will auto-wash them.' 
        : 'Auto-delete on finish all disabled.', 
      'info'
    );
  };

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto erase toast in 3.5sec
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToastLocally = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Session check on component mount with transient network retry mitigation
  useEffect(() => {
    let active = true;
    let attempt = 0;
    const maxAttempts = 3;

    async function checkSession() {
      try {
        const r = await fetch('/api/auth/me', {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (r.ok) {
          const data = await r.json();
          if (active) {
            if (data.user) {
              setUser(data.user);
            }
            setLoading(false);
          }
        } else {
          if (active) setLoading(false);
        }
      } catch (err) {
        console.error('Failed verifying user session active context', err);
        if (active) {
          if (attempt < maxAttempts) {
            attempt++;
            console.log(`Transient network issue. Retrying session checks (${attempt}/${maxAttempts}) in 1.5s...`);
            setTimeout(checkSession, 1500);
          } else {
            setLoading(false);
          }
        }
      }
    }
    checkSession();
    return () => {
      active = false;
    };
  }, []);

  // 2. Load lists anytime an authenticated user context exists
  const fetchTasksList = async () => {
    if (!user) return;
    try {
      const r = await fetch('/api/tasks', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (r.ok) {
        const data = await r.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error reloading tasks repository list', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasksList();
    } else {
      setTasks([]);
    }
  }, [user]);

  // 3. Dark state synchronization with local storage
  useEffect(() => {
    const cachedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = cachedTheme === 'dark' || (!cachedTheme && systemPrefersDark);
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkModeTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      triggerToast('Dark theme activated', 'info');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      triggerToast('Light theme activated', 'info');
    }
  };

  // Keyboard shortcut for Dark Mode Toggle (ALT + D)
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleDarkModeTheme();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [darkMode]);

  // 4. CRUD Task Actions Helpers
  const handleTaskCreate = async (taskData: Omit<Task, 'id' | 'created_at' | 'user_id' | 'position'>): Promise<boolean> => {
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(taskData)
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || 'Create process rejected');
      }
      await fetchTasksList();
      return true;
    } catch (e: any) {
      triggerToast(e.message || 'Error occurred creating task', 'error');
      return false;
    }
  };

  const handleQuickTaskCreate = async (title: string, priority: 'low' | 'medium' | 'high', category: string) => {
    const success = await handleTaskCreate({
      title,
      description: 'Quick task description metadata.',
      priority,
      category,
      due_date: '',
      completed: false
    });
    if (success) {
      triggerToast(`Added task: "${title.slice(0, 18)}..."`, 'success');
    }
  };

  const handleTaskUpdate = async (id: string, updates: Partial<Task>) => {
    // Optimistic UI updates to secure highly fast microinteractions
    const previousTasks = [...tasks];
    setTasks((prev) => 
      prev.map((t) => t.id === id ? { ...t, ...updates } : t)
    );

    try {
      const r = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(updates)
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || 'Update action rejected');
      }
    } catch (e: any) {
      triggerToast(e.message || 'Failed to record updates on database.', 'error');
      setTasks(previousTasks); // Rollback to precise local backup
    }
  };

  const handleTaskDelete = async (id: string) => {
    const previousTasks = [...tasks];
    const deletedTask = tasks.find(t => t.id === id);
    // Optimistic delete
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const r = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || 'Delete operation failed');
      }
      triggerToast(deletedTask ? `"${deletedTask.title.slice(0,20)}" deleted` : 'Task deleted', 'info');
    } catch (e: any) {
      triggerToast(e.message || 'Failed to delete item.', 'error');
      setTasks(previousTasks); // Rollback to precise local backup
    }
  };

  const handleTasksBulkDelete = async (type: 'completed' | 'all') => {
    const previousTasks = [...tasks];
    
    // Optimistic UI update
    if (type === 'all') {
      setTasks([]);
    } else {
      setTasks((prev) => prev.filter(t => !t.completed));
    }

    try {
      const queryParam = type === 'all' ? 'all=true' : 'completed=true';
      const r = await fetch(`/api/tasks?${queryParam}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || 'Bulk delete operation failed');
      }
      triggerToast(
        type === 'all' 
          ? 'Successfully cleared all tasks.' 
          : 'Successfully cleared completed tasks.', 
        'success'
      );
    } catch (e: any) {
      triggerToast(e.message || 'Failed to bulk delete.', 'error');
      setTasks(previousTasks); // Rollback to precise local backup
    }
  };

  // Auto-delete when all tasks are complete
  useEffect(() => {
    if (autoDeleteOnFinish && tasks.length > 0 && tasks.every((t) => t.completed)) {
      const timer = setTimeout(() => {
        triggerToast('All tasks completed! Auto-deleting all finished tasks as configured.', 'success');
        handleTasksBulkDelete('all');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tasks, autoDeleteOnFinish]);

  const handleTasksReorder = async (ids: string[]) => {
    const previousTasks = [...tasks];
    // Local reorder sort algorithm mapping
    const lookupMap = new Map(tasks.map(t => [t.id, t]));
    const reordered: Task[] = [];
    ids.forEach((id, idx) => {
      const match = lookupMap.get(id);
      if (match) {
        const taskObj = match as Task;
        reordered.push({ ...taskObj, position: (idx + 1) * 1000 });
      }
    });

    setTasks(reordered); // Optimistic sort list

    try {
      const r = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ ids })
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        throw new Error(errorData.error || 'Reordering catalog rejected');
      }
    } catch (e: any) {
      triggerToast(e.message || 'Unable to secure order on server database.', 'error');
      setTasks(previousTasks); // Rollback to precise local backup
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('session_token');
      const r = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (r.ok) {
        setUser(null);
        setCurrentTab('dashboard');
        triggerToast('Logged out successfully', 'success');
      }
    } catch (e) {
      triggerToast('Error updating logout session parameters', 'error');
    }
  };

  // 5. Selecting dynamic panels
  const renderActiveTabContent = () => {
    switch (currentTab) {
      case 'todos':
        return (
          <TaskListView
            tasks={tasks}
            user={user!}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTasksReorder={handleTasksReorder}
            toast={triggerToast}
            onTaskSelect={setSelectedTaskForDetail}
            onBulkDelete={handleTasksBulkDelete}
            autoDeleteOnFinish={autoDeleteOnFinish}
            onToggleAutoDelete={toggleAutoDeleteOnFinish}
            sidebarCategoryFilter={activeProjectFilter}
            onSelectProject={setActiveProjectFilter}
          />
        );
      case 'focus':
        return (
          <FocusTimerView
            tasks={tasks}
            toast={triggerToast}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            onTaskChange={(updated) => handleTaskUpdate(updated.id, updated)}
            onNavigateToTab={setCurrentTab}
            toast={triggerToast}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView 
            tasks={tasks} 
            toast={triggerToast} 
          />
        );
      case 'profile':
        return (
          <ProfileView
            user={user!}
            onProfileUpdate={(updated) => setUser(updated)}
            toast={triggerToast}
          />
        );
      default:
        return (
          <DashboardView
            tasks={tasks}
            onQuickTaskCreate={handleQuickTaskCreate}
            onTaskChange={(updated) => handleTaskUpdate(updated.id, updated)}
            onNavigateToTab={setCurrentTab}
            onTaskSelect={setSelectedTaskForDetail}
            toast={triggerToast}
          />
        );
    }
  };

  // 6. Universal Loader Setup
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-transparent text-gray-500 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest font-mono font-semibold animate-pulse text-indigo-600">Syncing core environment...</span>
      </div>
    );
  }

  // Double check Authentication
  if (!user) {
    return (
      <>
        <AuthView 
          onAuthSuccess={(u, token) => {
            if (token) {
              localStorage.setItem('session_token', token);
            }
            setUser(u);
          }} 
          toast={triggerToast} 
        />
        {/* Render Toast Alert queues for authentication feed */}
        <ToastList toasts={toasts} onClose={removeToastLocally} />
      </>
    );
  }

  return (
    <div className="flex bg-transparent min-h-screen font-sans text-gray-900 transition-colors duration-200">
      
      {/* Navigation Layout Control sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkModeTheme}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        tasks={tasks}
        activeProject={activeProjectFilter}
        onSelectProject={setActiveProjectFilter}
      />

      {/* Main dynamic viewport section */}
      <main className="flex-grow md:pl-64 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {renderActiveTabContent()}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          onUpdate={(id, updates) => {
            handleTaskUpdate(id, updates);
            setSelectedTaskForDetail(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
          }}
          onDelete={handleTaskDelete}
          toast={triggerToast}
        />
      )}

      {/* Multi Float Alert Toast lists overlay */}
      <ToastList toasts={toasts} onClose={removeToastLocally} />
    </div>
  );
}

// Subordinate helper Toast Render List
interface ToastListProps {
  toasts: ToastAlert[];
  onClose: (id: string) => void;
}

function ToastList({ toasts, onClose }: ToastListProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'info': return <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
      default: return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'error': return 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 backdrop-blur-md';
      case 'info': return 'border-indigo-500/30 bg-white/70 dark:bg-slate-900/40 text-indigo-950 dark:text-indigo-200 backdrop-blur-md';
      default: return 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 backdrop-blur-md';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none w-full max-w-xs sm:max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 50 }}
            className={`p-3.5 rounded-2xl border border-solid shadow-lg flex gap-3 pointer-events-auto items-start ${getAlertBg(toast.type)}`}
          >
            {getAlertIcon(toast.type)}
            
            <div className="flex-grow">
              <p className="text-xs font-semibold leading-relaxed text-justify break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onClose(toast.id)}
              className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-gray-400 hover:text-gray-900 transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
