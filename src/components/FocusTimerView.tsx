import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  CheckSquare, 
  Sparkles, 
  Flame, 
  Volume2, 
  Coffee, 
  Clock, 
  Compass,
  Lightbulb,
  BellRing
} from 'lucide-react';
import { Task } from '../types.js';

interface FocusTimerViewProps {
  tasks: Task[];
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function FocusTimerView({ tasks, toast }: FocusTimerViewProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [muteSound, setMuteSound] = useState(false);

  const initialTimes: Record<TimerMode, number> = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mode changes to update timers
  useEffect(() => {
    setTimeLeft(initialTimes[mode]);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [mode]);

  // Update browser document tab title with remaining countdown
  useEffect(() => {
    if (isPlaying) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      const statusText = mode === 'work' ? 'Focus' : 'Break';
      document.title = `(${formattedTime}) ${statusText} • TaskFlow`;
    } else {
      document.title = 'TaskFlow • Workspace';
    }

    return () => {
      document.title = 'TaskFlow • Workspace';
    };
  }, [timeLeft, isPlaying, mode]);

  // Handle countdown logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, mode]);

  // Sound generator
  const triggerAlarmChime = () => {
    if (muteSound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Chime note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6

      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 1.5);
    } catch (err) {
      console.log('Audio chime played in unsupported frame block conditions', err);
    }
  };

  const handleTimerComplete = () => {
    setIsPlaying(false);
    triggerAlarmChime();

    if (mode === 'work') {
      setCompletedSessions((prev) => prev + 1);
      const linkedTask = tasks.find((t) => t.id === selectedTaskId);
      const taskMessage = linkedTask ? ` linked to "${linkedTask.title.slice(0, 16)}"` : '';
      toast(`Concentration session finished! Sweet accomplishments${taskMessage}!`, 'success');
      setMode('shortBreak');
    } else {
      toast('Break is over! Ready to focus and smash some goals?', 'info');
      setMode('work');
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetTimer = () => {
    setIsPlaying(false);
    setTimeLeft(initialTimes[mode]);
    toast('Focus countdown reset', 'info');
  };

  const skipTimer = () => {
    setIsPlaying(false);
    if (mode === 'work') {
      setMode('shortBreak');
    } else {
      setMode('work');
    }
    toast('Interval skipped successfully', 'info');
  };

  // Calculate percentages for gauges
  const totalDuration = initialTimes[mode];
  const percentLeft = (timeLeft / totalDuration) * 100;
  const strokeDashoffset = 339.292 * (1 - timeLeft / totalDuration);

  // Active uncompleted tasks
  const activeTasks = tasks.filter((t) => !t.completed);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeStyles = (currentMode: TimerMode) => {
    switch (currentMode) {
      case 'work':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-500/20',
          stroke: 'stroke-rose-500 dark:stroke-rose-400',
          ringBg: 'stroke-rose-100 dark:stroke-rose-950/40',
          label: 'Focus Time',
          colorCode: '#ef4444'
        };
      case 'shortBreak':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
          stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
          ringBg: 'stroke-emerald-100 dark:stroke-emerald-950/40',
          label: 'Short Break',
          colorCode: '#10b981'
        };
      case 'longBreak':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-950/20 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
          stroke: 'stroke-indigo-500 dark:stroke-indigo-400',
          ringBg: 'stroke-indigo-100 dark:stroke-indigo-950/40',
          label: 'Long Break',
          colorCode: '#6366f1'
        };
    }
  };

  const modeStyle = getModeStyles(mode);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1.5 font-sans tracking-tight">
          Focus Workspace
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Adopt the popular "Pomodoro Technique" — divide works into 25-minute intervals to stay energized and sharp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TIMER CORE MODULECARD */}
        <div className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center min-h-[460px] text-center shadow-lg relative overflow-hidden">
          
          {/* Subtle background decoration */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          {/* Mode Selector Pill Swappers */}
          <div className="flex p-1 bg-gray-100/80 dark:bg-slate-900/60 rounded-xl mb-8 border border-gray-200/50 dark:border-white/5 relative z-10">
            {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 capitalize ${
                  mode === m
                    ? m === 'work'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : m === 'shortBreak'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-indigo-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          {/* CIRCULAR PROGRESS RING & TIME */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer ring */}
              <circle
                cx="128"
                cy="128"
                r="108"
                className={`${modeStyle.ringBg} transition-colors duration-500`}
                strokeWidth="6"
                fill="transparent"
              />
              {/* Active countdown meter */}
              <circle
                cx="128"
                cy="128"
                r="108"
                className={`${modeStyle.stroke} transition-all duration-300`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="678.584"
                strokeDashoffset={678.584 * (1 - timeLeft / totalDuration)}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner text countdown overlay */}
            <div className="absolute flex flex-col items-center">
              <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${modeStyle.bg.split(' ')[2]} mb-1.5 px-3 py-1 rounded-full border border-solid`}>
                {modeStyle.label}
              </span>
              <span className="text-5xl font-black text-gray-900 dark:text-white leading-none font-mono tracking-tight select-none">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-2 font-mono">
                {Math.round(percentLeft)}% Remaining
              </span>
            </div>
          </div>

          {/* TIMER BUTTON CONTROLS */}
          <div className="flex items-center justify-center gap-4 relative z-10">
            {/* Reset button */}
            <button
              onClick={resetTimer}
              title="Reset session timer"
              className="p-3 bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Main Play/Pause */}
            <button
              onClick={togglePlay}
              className={`px-8 py-3.5 rounded-2xl text-white font-bold text-sm tracking-wide transition-all shadow-md flex items-center gap-2 hover:scale-[1.03] active:scale-[0.98] cursor-pointer ${
                isPlaying
                  ? 'bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-gray-500/10'
                  : mode === 'work'
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                    : mode === 'shortBreak'
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                      : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 text-white fill-white" />
                  Pause Focus
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  Start Focus
                </>
              )}
            </button>

            {/* Skip button */}
            <button
              onClick={skipTimer}
              title="Skip current cycle"
              className="p-3 bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Sound Mute Toggle */}
          <div className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
            <button
              onClick={() => setMuteSound(!muteSound)}
              className="hover:text-gray-700 dark:hover:text-slate-400 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Volume2 className={`w-3.5 h-3.5 ${muteSound ? 'text-gray-300 line-through' : 'text-indigo-500'}`} />
              <span>{muteSound ? 'Audio chime muted' : 'Audio alerts enabled'}</span>
            </button>
          </div>

        </div>

        {/* TIMER SETTINGS & LINKED TASKS SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* LINK ACTIVE TASK TO FOCUS */}
          <div className="p-5 glass-panel rounded-2xl shadow-md border-white/5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">Focus Target Task</h2>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Allocate your active focus blocks to a single queued task item, letting you track dedicated attention on priorities.
            </p>

            <label className="block text-[11px] text-gray-400 uppercase tracking-widest font-mono mb-2">Select Active Task</label>
            {activeTasks.length === 0 ? (
              <div className="p-3 bg-gray-50 dark:bg-black/10 border border-dashed border-gray-200 dark:border-white/5 rounded-xl text-center text-xs text-gray-400">
                You have no active pending tasks in your registry. Create tasks to focus.
              </div>
            ) : (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/20 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="" className="dark:bg-slate-900">-- None / General Focus --</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id} className="dark:bg-slate-900 truncate">
                    [{t.category}] {t.title.slice(0, 28)}{t.title.length > 28 ? '...' : ''}
                  </option>
                ))}
              </select>
            )}

            {selectedTaskId && (
              <div className="mt-4 p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-xl text-left flex gap-2.5 items-start">
                <Flame className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono text-rose-500 dark:text-rose-400 uppercase tracking-wider font-bold">Currently focusing on:</span>
                  <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                    {tasks.find((t) => t.id === selectedTaskId)?.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FOCUS ANALYTICS CHIP */}
          <div className="p-5 glass-panel rounded-2xl shadow-md border-white/5 flex flex-col justify-between h-[230px]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="text-sm font-bold text-gray-950 dark:text-white">Workspace Achievements</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal">
                Celebrate your concentration wins. Complete cycles to collect points and fuel your daily streak counters.
              </p>
            </div>

            <div className="bg-white/30 dark:bg-black/15 p-3.5 rounded-xl border border-white/20 dark:border-white/5 flex items-center justify-between shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500 block">Completed Today:</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                  {completedSessions} <span className="text-xs font-medium text-gray-500 dark:text-slate-500">Pomodoros</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold shrink-0">
                🔥
              </div>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed text-center font-mono italic">
              "Focus isn't about saying yes to what is on the page, but saying no to a hundred other things."
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
