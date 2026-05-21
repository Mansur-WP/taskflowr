import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Clock, 
  CalendarDays,
  Tag,
  X
} from 'lucide-react';
import { Task } from '../types.js';

interface CalendarViewProps {
  tasks: Task[];
  onTaskChange: (updatedTask: Task) => void;
  onNavigateToTab: (tab: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CalendarView({
  tasks,
  onTaskChange,
  onNavigateToTab,
  toast
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar boundaries
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  // Front pad elements for start day offset
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Month numbering
  for (let i = 1; i <= lastDay; i++) {
    daysArray.push(i);
  }

  // Prev / Next actions
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayStr(null);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-indigo-500';
    }
  };

  // Check if a task is due on a given day helper
  const getTasksForDay = (day: number) => {
    const formattedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => t.due_date === formattedDateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // Calculate standard weekly calendar grid
  const selectedDayTasks = selectedDayStr 
    ? tasks.filter((t) => t.due_date === selectedDayStr) 
    : [];

  const handleDayCellClick = (dayStr: string) => {
    setSelectedDayStr(dayStr === selectedDayStr ? null : dayStr);
  };

  const toggleTaskStatus = (t: Task) => {
    const nextVal = !t.completed;
    onTaskChange({ ...t, completed: nextVal });
    toast(nextVal ? `"${t.title}" marked completed!` : `"${t.title}" reopened.`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: CALENDAR WORKSPACE */}
      <div className="lg:col-span-8 p-5 glass-panel rounded-2xl shadow-md border-white/5 space-y-4">
        
        {/* Navigation buttons bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              {monthNames[month]} {year}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-white/20 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCurrentDate(new Date()); setSelectedDayStr(null); }}
              className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider font-mono bg-white/25 hover:bg-white/35 dark:bg-white/5 dark:hover:bg-white/10 rounded-md text-gray-600 dark:text-slate-300 transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-white/20 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center font-mono text-xs font-bold text-gray-400 mb-1">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Box Grid */}
        <div className="grid grid-cols-7 gap-1.5 bg-white/5 dark:bg-black/15 p-1.5 rounded-2xl border border-white/5">
          {daysArray.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square bg-transparent rounded-lg" />;
            }

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = getTasksForDay(day);
            const pendingDayTasks = dayTasks.filter((t) => !t.completed);
            const activeMatch = selectedDayStr === dayString;

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleDayCellClick(dayString)}
                className={`aspect-square p-2 text-left rounded-xl border group relative flex flex-col justify-between transition-all duration-200 hover:scale-[1.03] min-w-0 font-sans cursor-pointer ${
                  activeMatch
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 font-bold shadow-lg shadow-indigo-500/5'
                    : isToday(day)
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                      : 'bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/25 border-white/10 dark:border-white/5 text-gray-700 dark:text-gray-300'
                }`}
              >
                {/* Number Indicator */}
                <span className="text-[11px] leading-tight block">{day}</span>

                {/* Task dot markers */}
                <div className="flex flex-wrap gap-0.5 justify-start min-w-0 max-w-full overflow-hidden">
                  {dayTasks.slice(0, 4).map((t) => (
                    <span 
                      key={t.id} 
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        t.completed ? 'bg-emerald-450' : getPriorityColor(t.priority)
                      }`}
                      title={t.title}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="text-[8px] scale-80 font-mono font-black text-gray-400 dark:text-gray-500 self-center shrink-0">
                      +{dayTasks.length - 4}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* RIGHT: COMPACT SIDE PANEL OF TASKS FOR THE DATE */}
      <div className="lg:col-span-4 space-y-4">
        <div className="p-5 glass-panel rounded-2xl shadow-md border-white/5 h-full min-h-[320px] flex flex-col">
          
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">Day Schedule Detail</h2>
              <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                {selectedDayStr ? new Date(selectedDayStr).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select any calendar day'}
              </span>
            </div>
            {selectedDayStr && (
              <button
                onClick={() => setSelectedDayStr(null)}
                className="p-1 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-grow overflow-y-auto space-y-3 pr-1.5">
            {!selectedDayStr ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-2xl block text-indigo-400 mb-2">📅</span>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">Click any day card element</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 max-w-[180px] mt-1 leading-normal">
                  Toggle day cards to quickly review, finalize, or resolve awaiting tasks.
                </p>
              </div>
            ) : selectedDayTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">Rest day / No tasks</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 max-w-[180px] mt-1">
                  Enjoy! You have no pending tasks or deadlines mapped to this calendar date.
                </p>
                <button
                  onClick={() => onNavigateToTab('todos')}
                  className="mt-3.5 px-3.5 py-1.5 bg-indigo-600 text-white font-semibold text-[10px] rounded-xl hover:bg-indigo-500 cursor-pointer shadow shadow-indigo-500/10"
                >
                  Schedule Tasks
                </button>
              </div>
            ) : (
              selectedDayTasks.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-3 bg-white/15 dark:bg-black/15 border border-white/20 dark:border-white/5 rounded-xl flex items-start gap-2.5 transition-all hover:scale-[1.01] ${
                    t.completed ? 'opacity-55' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleTaskStatus(t)}
                    className={`w-4 h-4 rounded mt-0.5 border shrink-0 flex items-center justify-center cursor-pointer ${
                      t.completed 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-300 dark:border-white/10 hover:border-indigo-500'
                    }`}
                  >
                    {t.completed && <Check className="w-2.5 h-2.5" />}
                  </button>

                  <div className="min-w-0 flex-grow">
                    <span className={`block text-xs font-semibold text-gray-900 dark:text-gray-300 truncate ${t.completed ? 'line-through text-gray-400 border-transparent' : ''}`}>
                      {t.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.2 rounded uppercase border ${
                        t.priority === 'high' ? 'text-rose-600 border-rose-100 dark:text-rose-400 dark:border-rose-900/35' : getPriorityColor(t.priority) + ' text-white'
                      }`}>
                        {t.priority}
                      </span>
                      <span className="text-[8px] font-semibold flex items-center gap-0.5 text-slate-400 dark:text-slate-400 shrink-0">
                        <Tag className="w-2.5 h-2.5 text-indigo-500" />
                        {t.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
