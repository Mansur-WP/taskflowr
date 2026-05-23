import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  CheckSquare, 
  AlertTriangle, 
  Calendar, 
  FileCheck, 
  Mail, 
  TrendingUp, 
  Tag, 
  Clock,
  ArrowUpRight,
  Sparkles,
  Send,
  HelpCircle,
  Award,
  BellRing
} from 'lucide-react';
import { Task, Reminder } from '../types.js';

interface DashboardViewProps {
  tasks: Task[];
  onQuickTaskCreate: (title: string, priority: 'low' | 'medium' | 'high', category: string) => void;
  onTaskChange: (updatedTask: Task) => void;
  onNavigateToTab: (tab: string) => void;
  onTaskSelect?: (task: Task) => void;
  toast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function DashboardView({
  tasks,
  onQuickTaskCreate,
  onTaskChange,
  onNavigateToTab,
  onTaskSelect,
  toast
}: DashboardViewProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [quickCategory, setQuickCategory] = useState('Work');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // AI Assistant States
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Core metrics derived from tasks
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const compPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Category project stats with completion telemetry
  const categoryStats = React.useMemo(() => {
    const stats: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((t) => {
      const cat = t.category || 'Other';
      if (!stats[cat]) {
        stats[cat] = { total: 0, completed: 0 };
      }
      stats[cat].total += 1;
      if (t.completed) {
        stats[cat].completed += 1;
      }
    });
    return Object.entries(stats).map(([category, data]) => {
      const percent = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      return {
        category,
        total: data.total,
        completed: data.completed,
        percent
      };
    });
  }, [tasks]);

  const getCategoryTheme = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('work')) return { stroke: 'stroke-indigo-500 dark:stroke-indigo-400', text: 'text-indigo-600 dark:text-indigo-450' };
    if (c.includes('person')) return { stroke: 'stroke-emerald-500 dark:stroke-emerald-400', text: 'text-emerald-600 dark:text-emerald-450' };
    if (c.includes('shop')) return { stroke: 'stroke-amber-500 dark:stroke-amber-400', text: 'text-amber-600 dark:text-amber-500' };
    if (c.includes('stud')) return { stroke: 'stroke-violet-500 dark:stroke-violet-400', text: 'text-violet-600 dark:text-violet-450' };
    return { stroke: 'stroke-cyan-500 dark:stroke-cyan-400', text: 'text-cyan-600 dark:text-cyan-450' };
  };

  // Smart Reminders categorization
  const overdueTasks = tasks.filter(t => !t.completed && t.due_date && t.due_date < new Date().toISOString().split('T')[0]);
  const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'high');
  const upcomingTodayTasks = tasks.filter(t => !t.completed && t.due_date === new Date().toISOString().split('T')[0]);

  // Preset prompts for AI Coach
  const presetPrompts = [
    { title: "Optimize Schedule", text: "Analyze my tasks and suggest which item I should focus on first and why." },
    { title: "Subtasks Suggestions", text: "Recommend a neat checklist of 4 subtasks to tackle my high priority pending items." },
    { title: "Weekly Routine Check", text: "Create a simple list of advice to help me balance study, work, and wellness." }
  ];

  // Fetch reminders on mount
  useEffect(() => {
    let active = true;
    async function loadReminders() {
      setLoadingReminders(true);
      try {
        const r = await fetch('/api/reminders', {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (r.ok) {
          const data = await r.json();
          if (active) setReminders(data);
        }
      } catch (e) {
        console.error('Error fetching reminders', e);
      } finally {
        if (active) setLoadingReminders(false);
      }
    }
    loadReminders();
    return () => {
      active = false;
    };
  }, [tasks]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickTaskCreate(quickTitle, quickPriority, quickCategory);
    setQuickTitle('');
    if (toast) toast(`Quick task "${quickTitle.slice(0, 15)}" added!`, 'success');
  };

  const handleAICoachPost = async (queryText: string) => {
    if (!queryText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ message: queryText })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error generating AI response');
      }

      setAiResponse(data.text);
    } catch (e: any) {
      console.error("AI Coach query fail:", e);
      setAiError(e.message || "Could not connect to modern productivity services. Please check integration settings.");
    } finally {
      setAiLoading(false);
    }
  };

  // Basic custom formatting for Markdown presentation inside the widget
  const renderFormattedAIResponse = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      // Bullet points
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        let content = line.trim().substring(1).trim();
        // highlight bold phrases
        return (
          <li key={idx} className="text-xs text-gray-800 dark:text-gray-300 ml-4 list-disc mb-1 leading-relaxed">
            {parseBoldInLine(content)}
          </li>
        );
      }
      
      // Standalone header
      if (line.trim().startsWith('###')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1 uppercase tracking-wider font-mono">
            {line.replace('###', '').trim()}
          </h4>
        );
      }

      return (
        <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed min-h-[0.5rem] mb-2 font-medium">
          {parseBoldInLine(line)}
        </p>
      );
    });
  };

  const parseBoldInLine = (line: string) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-gray-950 dark:text-white bg-indigo-500/10 dark:bg-indigo-400/5 px-1 rounded">{part}</strong>;
      }
      return part;
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/5 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30';
      case 'medium': return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/5 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30';
      default: return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/5 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30';
    }
  };

  // Filter 4 pending tasks for overview
  const recentPending = tasks
    .filter((t) => !t.completed)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Greetings Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1.5 font-sans tracking-tight bg-gradient-to-r from-gray-900 to-indigo-950 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Workspace Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">
            Welcome to your premium hub. Let's tackle your schedule with precision.
          </p>
        </div>

        {/* Live Metrics Date Time */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-gray-650 dark:text-slate-300 rounded-xl text-xs font-mono shadow-xs shrink-0 self-start md:self-auto">
          <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
          <span className="font-semibold select-none">UTC: {new Date().toISOString().slice(0,10)} {new Date().toISOString().slice(11,16)}</span>
        </div>
      </div>

      {/* METRICS ROW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <div className="p-5 glass-panel rounded-2xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-300 cursor-pointer" onClick={() => onNavigateToTab('todos')}>
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">Total Tasks</span>
            <span className="block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-sans tracking-tight">
              {totalCount}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 block">Current dashboard load</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 dark:border-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <CheckSquare className="w-5 h-5 stroke-[2.5px]" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-5 glass-panel rounded-2xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-300">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono font-medium">Completed Tasks</span>
            <span className="block text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sans tracking-tight">
              {completedCount}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
              {compPercentage}% completion rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <FileCheck className="w-5 h-5 stroke-[2.5px]" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="p-5 glass-panel rounded-2xl flex items-center justify-between sm:col-span-2 lg:col-span-1 hover:scale-[1.01] transition-transform duration-300">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">Pending Tasks</span>
            <span className="block text-3xl font-extrabold text-amber-600 dark:text-amber-500 font-sans tracking-tight">
              {pendingCount}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-slate-500 block">Actions awaiting execution</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.5px]" />
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN LEFT: Reminders & Tasks List */}
        <div className="lg:col-span-7 space-y-6">

          {/* DYNAMIC GEMINI AI WORKFLOW COACH ASSISTANT */}
          <div className="p-5 glass-panel rounded-2xl space-y-4 shadow-md bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/15 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-650/5 dark:bg-indigo-400/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-light-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    AI Workspace Assist
                  </h2>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">Powered by gemini-3.5-flash</p>
                </div>
              </div>
              
              <span className="text-[10px] select-none font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider">
                Coach Live
              </span>
            </div>

            {/* Response Section */}
            <div className="min-h-[6rem] max-h-[14rem] overflow-y-auto bg-white/45 dark:bg-black/20 rounded-xl p-4 border border-dashed border-indigo-500/15">
              {aiLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-6 text-center text-xs text-gray-400 shrink-0">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="font-semibold text-gray-500 dark:text-gray-300">Analyzing scheduling telemetry & formulation advisory...</p>
                </div>
              ) : aiError ? (
                <div className="h-full flex flex-col items-center justify-center py-4 text-center text-xs text-rose-500 gap-1.5">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <p className="font-semibold max-w-sm">{aiError}</p>
                </div>
              ) : aiResponse ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5 text-xs text-justify pr-1"
                >
                  {renderFormattedAIResponse(aiResponse)}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <Award className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mb-2 stroke-[1.5px]" />
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Hi {tasks.length > 0 ? "ready" : "welcome"}!</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-400 max-w-sm mt-1 leading-normal">
                    Let's streamline your productivity! Tap a preset query block below or write a custom question to analyze your current scheduled tasks.
                  </p>
                </div>
              )}
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-2.5">
              {presetPrompts.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setAiQuery(preset.text);
                    handleAICoachPost(preset.text);
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-indigo-500/20 dark:border-white/5 bg-white/70 dark:bg-white/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:scale-[1.01] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {preset.title}
                </button>
              ))}
            </div>

            {/* Text Area Submit Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (aiQuery.trim()) handleAICoachPost(aiQuery);
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5"
            >
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask AI assistant about your schedules, plan subtasks, routine advice..."
                className="flex-grow bg-white dark:bg-black/10 border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500/40"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center shadow cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* QUICK CHIP ADD TASK PANEL */}
          <div className="p-5 glass-panel rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-gray-950 dark:text-white mb-4">Quick Single Task Creator</h2>
            <form onSubmit={handleQuickSubmit} className="space-y-3.5">
              <input
                type="text"
                required
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-indigo-500/20 dark:border-white/10 bg-white/15 dark:bg-black/15 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500/50"
                placeholder="What needs to be done? Enter title..."
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <select
                    value={quickPriority}
                    onChange={(e: any) => setQuickPriority(e.target.value)}
                    className="px-2.5 py-1.5 text-[11px] rounded-lg bg-white/40 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-bold text-gray-700 dark:text-gray-300"
                  >
                    <option value="low" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Low Priority</option>
                    <option value="medium" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Medium Priority</option>
                    <option value="high" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">High Priority</option>
                  </select>

                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="px-2.5 py-1.5 text-[11px] rounded-lg bg-white/40 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-bold text-gray-700 dark:text-gray-300"
                  >
                    <option value="Work" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Work</option>
                    <option value="Personal" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Personal</option>
                    <option value="Shopping" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Shopping</option>
                    <option value="Study" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Study</option>
                    <option value="Other" className="text-gray-900 dark:text-white dark:bg-slate-900 font-semibold">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Quick
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* COLUMN RIGHT: Circular Chart & Recent Tasks List */}
        <div className="lg:col-span-5 space-y-6">

          {/* SVG Progress Card */}
          <div className="p-5 glass-panel rounded-2xl text-center flex flex-col items-center justify-center shadow-md">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 w-full text-left">Completion Health</h2>
            
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* SVG circular track */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-gray-100 dark:stroke-white/5"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-indigo-500 dark:stroke-indigo-400 transition-all duration-1000"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={351.8}
                  strokeDashoffset={351.8 - (351.8 * compPercentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3.5xl font-black text-gray-950 dark:text-white tracking-tighter">{compPercentage}%</span>
                <span className="text-[9px] uppercase font-mono text-gray-400 dark:text-slate-500 tracking-widest font-extrabold select-none">Solved</span>
              </div>
            </div>

            <div className="mt-5 text-xs text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed font-semibold">
              {totalCount === 0 
                ? 'Create tasks to get an analytic overview of your target completions.' 
                : `${completedCount} out of ${totalCount} tasks completed. Keep pushing forward!`}
            </div>
          </div>

          {/* Project Completion Rings Card */}
          <div id="category-progress-breakdowns-card" className="p-5 glass-panel rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-light-slate-100 dark:border-white/5">
              <h2 id="category-breakdowns-title" className="text-sm font-bold text-gray-900 dark:text-white">Project Progress</h2>
              <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">BY CATEGORY</span>
            </div>
            
            {categoryStats.length === 0 ? (
              <p className="text-xs text-center py-4 text-gray-400 dark:text-slate-500 italic">No category projects found. Add tasks to see breakdown statistics.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {categoryStats.map((stat) => {
                  const theme = getCategoryTheme(stat.category);
                  const circ = 113.1; // 2 * Math.PI * 18
                  const strokeOffset = circ - (circ * stat.percent) / 100;
                  
                  return (
                    <div 
                      key={stat.category} 
                      id={`project-completion-${stat.category.toLowerCase()}`}
                      className="p-3 rounded-xl bg-white/20 dark:bg-black/10 border border-slate-150 dark:border-white/5 flex items-center gap-3 transition-transform hover:scale-[1.01]"
                    >
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            className="stroke-gray-150 dark:stroke-white/5"
                            strokeWidth="3.5"
                            fill="transparent"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="18"
                            className={`${theme.stroke} transition-all duration-700`}
                            strokeWidth="3.5"
                            fill="transparent"
                            strokeDasharray={circ}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-extrabold text-gray-950 dark:text-white">
                          {stat.percent}%
                        </span>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-gray-950 dark:text-gray-150 truncate" title={stat.category}>
                          {stat.category}
                        </span>
                        <span className="block text-[10px] font-semibold text-gray-500 dark:text-slate-400">
                          {stat.completed}/{stat.total} Done
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIMULATED DUST OVER SMART REMINDERS ALERT BAR */}
          <div className="p-5 glass-panel rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-solid border-slate-100 dark:border-white/5">
              <BellRing className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">Smart Reminders Feed</h2>
            </div>

            <div className="space-y-2">
              {overdueTasks.length > 0 && (
                <div className="p-2.5 bg-rose-500/5 dark:bg-rose-950/20 border border-solid border-rose-500/20 rounded-xl text-[11px] flex gap-2.5 text-rose-700 dark:text-rose-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Overdue Checkpoint:</span> You have <span className="font-bold">{overdueTasks.length}</span> pending items past their planned due date!
                  </div>
                </div>
              )}

              {upcomingTodayTasks.length > 0 && (
                <div className="p-2.5 bg-amber-500/5 dark:bg-amber-950/20 border border-solid border-amber-500/20 rounded-xl text-[11px] flex gap-2.5 text-amber-700 dark:text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Due Today:</span> <span className="font-bold">{upcomingTodayTasks.length}</span> critical components planned for today require review.
                  </div>
                </div>
              )}

              {highPriorityTasks.length > 0 && (
                <div className="p-2.5 bg-indigo-500/5 dark:bg-indigo-950/20 border border-solid border-indigo-500/20 rounded-xl text-[11px] flex gap-2.5 text-indigo-700 dark:text-indigo-400 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">High Priority Focus:</span> <span className="font-bold">{highPriorityTasks.length}</span> high priority items are open on your backlog.
                  </div>
                </div>
              )}

              {overdueTasks.length === 0 && upcomingTodayTasks.length === 0 && highPriorityTasks.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 italic">
                  No critical pipeline alerts. Backlog is clear & balanced!
                </div>
              )}
            </div>
          </div>

          {/* Quick Active tasks checklist */}
          <div className="p-5 glass-panel rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="text-sm font-bold text-gray-950 dark:text-white">Imminent Tasks Overview</h2>
              <button 
                onClick={() => onNavigateToTab('todos')}
                className="text-[11px] text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-extrabold"
              >
                Go to board
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentPending.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400 dark:text-slate-500">All caught up! No waiting pending tasks.</p>
            ) : (
              <div className="space-y-3">
                {recentPending.map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => onTaskSelect && onTaskSelect(t)}
                    className="p-3 bg-white/20 dark:bg-[#161722]/50 border border-slate-150 dark:border-white/5 rounded-xl flex items-center justify-between hover:border-indigo-500/20 dark:hover:border-white/10 cursor-pointer hover:scale-[1.01] transition-transform"
                    title="Click to manage parameters & subtasks"
                  >
                    <div className="flex items-center gap-3 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          onTaskChange({ ...t, completed: true });
                          if (toast) toast(`"${t.title.slice(0, 15)}" completed!`, 'success');
                        }}
                        className="w-4.5 h-4.5 rounded border border-solid border-slate-300 dark:border-white/10 flex items-center justify-center hover:border-indigo-500 cursor-pointer"
                      >
                        <CheckSquare className="w-3 h-3 opacity-0 hover:opacity-40" />
                      </button>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-gray-900 dark:text-gray-200 truncate pr-2">
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold flex items-center gap-0.5 text-gray-400 dark:text-slate-500">
                            <Tag className="w-2.5 h-2.5 text-indigo-400" />
                            {t.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold shrink-0 select-none font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
