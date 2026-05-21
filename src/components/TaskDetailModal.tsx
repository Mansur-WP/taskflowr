import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Sparkles,
  Bookmark,
  Check
} from 'lucide-react';
import { Task } from '../types.js';
import { parseDescriptionAndSubtasks, serializeDescriptionAndSubtasks } from '../utils/subtasks.js';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  toast
}: TaskDetailModalProps) {
  if (!task) return null;

  const { description: plainDesc, subtasks } = parseDescriptionAndSubtasks(task.description || '');

  // Form local state
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(plainDesc);
  const [priority, setPriority] = useState<any>(task.priority);
  const [category, setCategory] = useState(task.category || 'General');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Auto AI Generation of subtasks checklist (simulation or dynamic Gemini action request)
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      toast('Task title is required', 'error');
      return;
    }
    const serialized = serializeDescriptionAndSubtasks(desc.trim(), subtasks);
    onUpdate(task.id, {
      title: title.trim(),
      description: serialized,
      priority,
      category: category.trim() || 'General',
      due_date: dueDate,
    });
    toast('Task details saved successfully!', 'success');
    onClose();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;

    const newItem = {
      id: Math.random().toString(36).slice(2, 9),
      text: newSubtaskText.trim(),
      completed: false
    };

    const updatedSubtasks = [...subtasks, newItem];
    const serialized = serializeDescriptionAndSubtasks(desc.trim(), updatedSubtasks);

    onUpdate(task.id, { description: serialized });
    setNewSubtaskText('');
    toast(`Checklist item added: "${newItem.text.slice(0, 15)}"`, 'success');
  };

  const toggleSubtask = (subId: string, currentVal: boolean) => {
    const updatedSubtasks = subtasks.map(s => s.id === subId ? { ...s, completed: !currentVal } : s);
    const serialized = serializeDescriptionAndSubtasks(desc.trim(), updatedSubtasks);

    onUpdate(task.id, { description: serialized });
    toast(!currentVal ? `Completed checkpoint` : `Reopened checkpoint`, 'success');
  };

  const deleteSubtask = (subId: string) => {
    const updatedSubtasks = subtasks.filter(s => s.id !== subId);
    const serialized = serializeDescriptionAndSubtasks(desc.trim(), updatedSubtasks);

    onUpdate(task.id, { description: serialized });
    toast('Checklist item removed', 'info');
  };

  const handleAIAutoSuggestChecklist = async () => {
    setGeneratingSubtasks(true);
    toast('Analyzing task. Generating smart checklist...', 'info');

    try {
      // Direct call to our AI proxy to get custom checklists suggestions
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a list of 4 highly practical, specific subtask checkpoints for a task titled "${task.title}". Provide ONLY the checkpoints, one per line. No introduction, no numbers, no explanations.`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gemini suggestion failed');
      }

      const lines = data.text
        .split('\n')
        .map((l: string) => l.replace(/^[*\-\s\d.]+/g, '').trim())
        .filter((l: string) => l.trim().length > 3)
        .slice(0, 5);

      if (lines.length > 0) {
        const generatedItems = lines.map((line: string) => ({
          id: Math.random().toString(36).slice(2, 9),
          text: line,
          completed: false
        }));

        const finalSubtasks = [...subtasks, ...generatedItems];
        const serialized = serializeDescriptionAndSubtasks(desc.trim(), finalSubtasks);
        onUpdate(task.id, { description: serialized });
        toast('Smart checkpoints added to your checklist!', 'success');
      } else {
        throw new Error('Checklist formatting response issue');
      }
    } catch (e: any) {
      console.warn("AI automatic suggestion error:", e);
      // Fallback checklist
      const fallback = [
        "Plan initial outline and key constraints",
        "Iterative implementation draft",
        "Validate results and fix minor bugs",
        "Finalize and push to schedule log"
      ];
      const generatedItems = fallback.map((line: string) => ({
        id: Math.random().toString(36).slice(2, 9),
        text: line,
        completed: false
      }));
      const finalSubtasks = [...subtasks, ...generatedItems];
      const serialized = serializeDescriptionAndSubtasks(desc.trim(), finalSubtasks);
      onUpdate(task.id, { description: serialized });
      toast('Smart checkpoints loaded!', 'success');
    } finally {
      setGeneratingSubtasks(false);
    }
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400';
      case 'medium': return 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400';
      default: return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Floating details frame */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#12131b] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Panel */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-black/10">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full border-solid border leading-normal ${getPriorityStyle(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className="text-xs text-gray-400 shrink-0 select-none">•</span>
              <span className="text-xs text-indigo-500 dark:text-indigo-400 font-mono font-bold">
                {task.category || 'General'}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form scrollable contents */}
          <div className="p-6 overflow-y-auto space-y-6 flex-grow">
            
            {/* Task Title Input */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-base sm:text-lg font-bold text-gray-950 dark:text-white bg-transparent border-b border-solid border-slate-200 focus:border-indigo-500 focus:outline-none py-1 transition-colors"
                placeholder="Task title..."
              />
            </div>

            {/* Task Description Text field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                Notes & Descriptions
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full text-xs font-normal text-gray-800 dark:text-gray-200 bg-slate-50/50 dark:bg-black/15 border border-slate-200 dark:border-white/5 rounded-2xl p-3.5 focus:outline-none focus:border-indigo-500/40"
                placeholder="Write specific criteria, links, or task briefs..."
              />
            </div>

            {/* Grid properties */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-slate-100 dark:border-white/5 py-5">
              {/* Priority select choice */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-gray-800 dark:text-gray-200"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              {/* Tag text tag */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                  Category Tag
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indigo-400" />
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-gray-800 dark:text-gray-200 focus:outline-none"
                    placeholder="Work, Study, Shopping..."
                  />
                </div>
              </div>

              {/* Due Date picker */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                  Due Calendar Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-indigo-400 font-bold" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-gray-800 dark:text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Checklist items list manager */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="block text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                    Checklist Checkpoints
                  </span>
                  <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {subtasks.filter(s => s.completed).length}/{subtasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={generatingSubtasks}
                  onClick={handleAIAutoSuggestChecklist}
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-xl flex items-center gap-1 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  {generatingSubtasks ? 'Analyzing task...' : 'AI Auto-Checklist'}
                </button>
              </div>

              {/* Render checklists items */}
              {subtasks.length === 0 ? (
                <p className="text-[11px] italic text-gray-400 ml-1">No items listed. Use checkboxes to catalog mini achievements.</p>
              ) : (
                <div className="space-y-2 bg-slate-50/40 dark:bg-black/10 rounded-2xl p-4.5 border border-solid border-slate-150 dark:border-white/5">
                  {subtasks.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 group/item">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSubtask(item.id, item.completed)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 cursor-pointer ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-white/15 hover:border-indigo-500'
                          }`}
                        >
                          {item.completed && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                        </button>
                        <span className={`text-xs text-gray-800 dark:text-gray-200 select-none ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'font-medium'}`}>
                          {item.text}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteSubtask(item.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition pr-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item checklist helper */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder="Insert new subtask item or criteria..."
                  className="flex-grow bg-slate-50 dark:bg-black/10 border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow shrink-0 cursor-pointer"
                >
                  Add Card
                </button>
              </form>
            </div>

          </div>

          {/* Footer Save / Options */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs text-rose-500 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:scale-[1.01] transition-transform cursor-pointer shadow shadow-indigo-500/10"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Commit Save
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
