import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Download, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  CalendarDays,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Task } from '../types.js';

interface AnalyticsViewProps {
  tasks: Task[];
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AnalyticsView({ tasks, toast }: AnalyticsViewProps) {
  const [exporting, setExporting] = useState(false);

  // Extract statistics locally
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const healthRate = total > 0 ? Math.round((completed / total) * 105) / 1.05 : 0; // percentage rounded

  // Priority distributes
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const medCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'low').length;
  const maxPriorityCount = Math.max(highCount, medCount, lowCount, 1);

  // Category counts
  const categoryMap: Record<string, number> = {};
  tasks.forEach((t) => {
    const cat = t.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categories = Object.keys(categoryMap).map((name) => ({
    name,
    count: categoryMap[name] || 0
  })).sort((a,b) => b.count - a.count);

  const maxCategoryCount = categories.length > 0 ? Math.max(...categories.map(c => c.count), 1) : 1;

  // Trigger real CSV download
  const handleExportCSV = async () => {
    setExporting(true);
    toast('Generating CSV data spreadsheet...', 'info');

    try {
      // Trigger a direct browser navigation download to /api/tasks/export
      window.location.href = '/api/tasks/export';
      toast('CSV task list spreadsheet downloaded successfully!', 'success');
    } catch (err) {
      toast('Failed exporting tasks to CSV format', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Export Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-md border-white/5">
        <div className="space-y-1">
          <h1 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
            Task Metrics & Export Controller
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Audit priority pipelines and output CSV spreadsheets directly.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting || total === 0}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-500/20"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {exporting ? 'Exporting...' : 'Export to CSV Spreadsheet'}
        </button>
      </div>

      {total === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl shadow-md border-white/5">
          <span className="text-3xl mb-2 block">📊</span>
          <p className="text-gray-900 dark:text-gray-200 font-bold text-sm">No task statistics available</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 max-w-xs mx-auto mt-1">
            Please catalog some active items or checklists under the Tasks board to formulate metrics reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PRIORITY PIPELINE VISUALIZATION */}
          <div className="p-5 glass-panel rounded-2xl space-y-4 shadow-sm border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-2 border-b border-white/10 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Volume by Priority
            </h2>
            
            <div className="space-y-4 pt-1 font-sans">
              {/* High */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-900 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    High Priority
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">{highCount} tasks</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(highCount / maxPriorityCount) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-900 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Medium Priority
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">{medCount} tasks</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(medCount / maxPriorityCount) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-900 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Low Priority
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">{lowCount} tasks</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(lowCount / maxPriorityCount) * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM CATEGORY TAXONOMY MAP */}
          <div className="p-5 glass-panel rounded-2xl space-y-4 shadow-sm border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 pb-2 border-b border-white/10 font-mono">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Volume by Categories
            </h2>

            <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-2">
              {categories.map((c) => (
                <div key={c.name} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900 dark:text-gray-300">{c.name}</span>
                    <span className="text-gray-500 dark:text-slate-400">{c.count} items ({Math.round((c.count / total) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.count / maxCategoryCount) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTRAL RATIO GAUGES */}
          <div className="p-5 glass-panel rounded-2xl shadow-sm border-white/5 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-2 self-center">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Workspace Health index</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-justify leading-relaxed">
                Currently tracking <b>{completed}</b> completed items against <b>{pending}</b> pending queues, generating an overall scheduling completion rate of <b>{Math.round(healthRate)}%</b>.
              </p>
            </div>

            <div className="flex items-center justify-center p-2 bg-white/10 dark:bg-black/10 border border-white/10 dark:border-white/5 rounded-xl">
              <div className="w-11/12 grid grid-cols-2 text-center gap-2">
                <div className="p-3 bg-white/15 dark:bg-white/5 border border-white/10 dark:border-white/5 rounded-xl shrink-0">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 block">Solved</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{completed}</span>
                </div>
                <div className="p-3 bg-white/15 dark:bg-white/5 border border-white/10 dark:border-white/5 rounded-xl shrink-0">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-rose-500 block">Remains</span>
                  <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{pending}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
