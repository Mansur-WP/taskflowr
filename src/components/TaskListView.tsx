import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Tag, 
  Calendar, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Move,
  Clock,
  Briefcase,
  ListTodo
} from 'lucide-react';
import { Task } from '../types.js';
import { parseDescriptionAndSubtasks, serializeDescriptionAndSubtasks, Subtask } from '../utils/subtasks.js';

interface TaskListViewProps {
  tasks: Task[];
  onTaskCreate: (taskData: Omit<Task, 'id' | 'created_at' | 'user_id' | 'position'>) => Promise<boolean>;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
  onTasksReorder: (ids: string[]) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onTaskSelect?: (task: Task) => void;
}

export default function TaskListView({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTasksReorder,
  toast,
  onTaskSelect
}: TaskListViewProps) {
  // Queries & Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [completedFilter, setCompletedFilter] = useState<string>('all');
  
  // Expanded checklists state and inline subtask inputs
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [newSubtaskTexts, setNewSubtaskTexts] = useState<Record<string, string>>({});
  
  // Create Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState('');

  // Editing Task State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Pagination Elements
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Extract list of all unique categories
  const allCategories = Array.from(new Set(tasks.map((t) => t.category || 'General')));

  // Filter Tasks locally before showing
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    
    let matchesCompleted = true;
    if (completedFilter === 'active') matchesCompleted = !t.completed;
    if (completedFilter === 'completed') matchesCompleted = t.completed;

    return matchesSearch && matchesPriority && matchesCategory && matchesCompleted;
  });

  // Pages calculations
  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const success = await onTaskCreate({
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category.trim() || 'General',
      due_date: dueDate,
      completed: false
    });

    if (success) {
      // Reset Form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('Work');
      setDueDate('');
      setIsAdding(false);
      toast('Task created successfully!', 'success');
    }
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    const { description: plainDesc } = parseDescriptionAndSubtasks(t.description || '');
    setEditDesc(plainDesc);
    setEditPriority(t.priority);
    setEditCategory(t.category);
    setEditDueDate(t.due_date || '');
  };

  const handleSaveEdit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    // Preserve existing subtasks when saving description alterations
    const originalTask = tasks.find(item => item.id === id);
    const { subtasks } = parseDescriptionAndSubtasks(originalTask?.description || '');

    onTaskUpdate(id, {
      title: editTitle.trim(),
      description: serializeDescriptionAndSubtasks(editDesc.trim(), subtasks),
      priority: editPriority,
      category: editCategory.trim() || 'General',
      due_date: editDueDate,
    });

    setEditingId(null);
    toast('Task changes saved!', 'success');
  };

  // -----------------------------------------------------------------
  // Drag & Drop HTML5 Handlers for Reordering
  // -----------------------------------------------------------------
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Use dynamic transparency class
    e.currentTarget.classList.add('opacity-30');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-30');
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    // Rearrange overall list
    const originalIds = tasks.map((t) => t.id);
    const fromIndex = originalIds.indexOf(draggedTaskId);
    const toIndex = originalIds.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updatedIds = [...originalIds];
      // remove from old sequence, insert under new target
      const [removed] = updatedIds.splice(fromIndex, 1);
      updatedIds.splice(toIndex, 0, removed);

      onTasksReorder(updatedIds);
      toast('Tasks ordering rearranged', 'info');
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/5 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 font-semibold';
      case 'medium': return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/5 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 font-semibold';
      default: return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/5 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Strip */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Query Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-indigo-500/20 dark:border-white/10 bg-white/15 dark:bg-black/15 text-gray-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              placeholder="Search tasks by title, content descriptions..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter priority */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 text-xs rounded-xl bg-white/20 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-medium text-gray-700 dark:text-gray-300"
            >
              <option value="all" className="dark:bg-slate-900">All Priorities</option>
              <option value="high" className="dark:bg-slate-900">High Priority</option>
              <option value="medium" className="dark:bg-slate-900">Medium Priority</option>
              <option value="low" className="dark:bg-slate-900">Low Priority</option>
            </select>

            {/* Filter category */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 text-xs rounded-xl bg-white/20 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-medium text-gray-700 dark:text-gray-300"
            >
              <option value="all" className="dark:bg-slate-900">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-slate-900">{cat}</option>
              ))}
            </select>

            {/* Filter status */}
            <select
              value={completedFilter}
              onChange={(e) => { setCompletedFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 text-xs rounded-xl bg-white/20 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-medium text-gray-700 dark:text-gray-300"
            >
              <option value="all" className="dark:bg-slate-900">Any Status</option>
              <option value="active" className="dark:bg-slate-900">Active/Pending</option>
              <option value="completed" className="dark:bg-slate-900">Completed</option>
            </select>

            {/* Creating task activation */}
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* CREATE TASK SLIDE PANEL */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateTaskSubmit} className="glass-panel p-6 rounded-2xl shadow-lg border-indigo-500/10 space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Create New Task Card</h3>
                <p className="text-[11px] text-gray-400">Fill details below to queue priority items</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none"
                      placeholder="e.g. Build API Endpoints"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none"
                      placeholder="Write description or task specs..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e: any) => setPriority(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/20 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 font-medium text-gray-700 dark:text-gray-300"
                      >
                        <option value="low" className="dark:bg-slate-900">Low</option>
                        <option value="medium" className="dark:bg-slate-900">Medium</option>
                        <option value="high" className="dark:bg-slate-900">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Category / Tag</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none"
                        placeholder="Work, Study, Shopping..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 bg-transparent hover:bg-white/20 dark:hover:bg-white/5 text-xs text-slate-500 hover:text-gray-900 dark:hover:text-white rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      Save Task Card
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TASK LIST RENDER BOARD */}
      {paginatedTasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center shadow-md">
          <div className="w-16 h-16 bg-white/20 dark:bg-white/5 text-slate-400 dark:text-gray-500 flex items-center justify-center rounded-2xl mx-auto mb-4 font-bold text-2xl shadow-inner">
            ∅
          </div>
          <p className="text-gray-950 dark:text-white font-semibold text-sm mb-1">No tasks queue matches filters</p>
          <p className="text-xs text-gray-400 dark:text-slate-400 max-w-sm mx-auto">
            Try resetting your search query or filters above, or create a brand new task item to catalog your schedule.
          </p>
          {search !== '' || priorityFilter !== 'all' || categoryFilter !== 'all' || completedFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearch('');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setCompletedFilter('all');
              }}
              className="mt-4 px-3.5 py-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 border border-indigo-200/50 dark:border-white/10 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:scale-[1.01] transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTasks.map((t) => {
            const isEditing = editingId === t.id;
            const { description: plainDesc, subtasks } = parseDescriptionAndSubtasks(t.description || '');
            const totalSubtasks = subtasks.length;
            const completedSubtasks = subtasks.filter((s) => s.completed).length;
            const isExpanded = !!expandedTaskIds[t.id];

            return (
              <div
                key={t.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, t.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, t.id)}
                className={`glass-panel p-4.5 rounded-2xl shadow-sm flex items-start gap-4 transition-all duration-300 hover:scale-[1.005] hover:border-indigo-500/30 dark:hover:border-white/15 group ${
                  t.completed ? 'opacity-60' : ''
                }`}
              >
                {/* Drag Grib handle on hover */}
                <div className="hidden sm:flex self-center text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing hover:text-indigo-500 transition-colors focus:outline-none shrink-0">
                  <Move className="w-4 h-4" />
                </div>

                {/* Status custom checkbox */}
                <div className="pt-0.5 shrink-0">
                  <button
                    onClick={() => onTaskChange(t, !t.completed)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                      t.completed 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-350 dark:border-white/10 hover:border-indigo-500'
                    }`}
                  >
                    {t.completed && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* TASK TEXT OVERS / INLINE EDIT WRAPPERS */}
                <div className="flex-grow min-w-0 pr-2">
                  {isEditing ? (
                    <form onSubmit={(e) => handleSaveEdit(e, t.id)} className="space-y-3 pt-1">
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={editPriority}
                          onChange={(e: any) => setEditPriority(e.target.value)}
                          className="px-2.5 py-1.5 text-[11px] rounded-lg bg-white/20 dark:bg-black/20 border border-indigo-500/20 dark:border-white/10 text-gray-700 dark:text-gray-300"
                        >
                          <option value="low" className="dark:bg-slate-900">Low Priority</option>
                          <option value="medium" className="dark:bg-slate-900">Medium Priority</option>
                          <option value="high" className="dark:bg-slate-900">High Priority</option>
                        </select>
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="px-2.5 py-1.5 text-[11px] rounded-lg bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:outline-none"
                          placeholder="Tag..."
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="px-2.5 py-1.5 text-[11px] rounded-lg bg-white/10 dark:bg-black/15 border border-indigo-500/20 dark:border-white/10 text-gray-700 dark:text-gray-300 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3.5 py-1.5 text-[10px] bg-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white transition rounded-xl cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 text-[10px] bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 hover:scale-[1.01] shadow shadow-indigo-500/10 cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {/* Meta titles */}
                      <span 
                        className={`block text-sm font-semibold text-gray-900 dark:text-gray-100 truncate ${
                          t.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                        }`}
                      >
                        {t.title}
                      </span>
                      
                      {plainDesc && (
                        <p className={`text-xs text-gray-500 dark:text-slate-400 mt-1 pb-1 max-w-2xl text-justify break-all ${
                          t.completed ? 'line-through text-gray-400/50' : ''
                        }`}>
                          {plainDesc}
                        </p>
                      )}

                      {/* Subtasks checklist section styled exactly like modern TickTick */}
                      <div className="mt-3.5 pt-2 border-t border-solid border-slate-100 dark:border-white/5 space-y-2 max-w-xl">
                        {/* Summary bar / Toggle Checklist trigger */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setExpandedTaskIds(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                            className={`text-[11px] font-bold hover:underline flex items-center gap-1.5 cursor-pointer ${
                              totalSubtasks === 0 
                                ? 'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-600 dark:text-gray-300'
                            }`}
                          >
                            <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                            <span>
                              {totalSubtasks === 0 
                                ? '+ Add Checklist Item' 
                                : `Checklist (${completedSubtasks}/${totalSubtasks} completed)`}
                            </span>
                          </button>
                          
                          {totalSubtasks > 0 && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                              {Math.round((completedSubtasks / totalSubtasks) * 100)}% done
                            </span>
                          )}
                        </div>

                        {/* Expandable checklist container */}
                        {isExpanded && (
                          <div className="pl-2 pr-1.5 py-2.5 mt-2 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-dashed border-indigo-500/15 dark:border-white/5 space-y-2.5 transition-all">
                            {/* Render items list */}
                            {subtasks.length === 0 ? (
                              <p className="text-[10px] text-gray-400 italic pl-1">No items listed. Type below to add checklist items.</p>
                            ) : (
                              subtasks.map((st) => (
                                <div key={st.id} className="flex items-center justify-between gap-2 group/item">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s);
                                        onTaskUpdate(t.id, { description: serializeDescriptionAndSubtasks(plainDesc, updated) });
                                        toast(st.completed ? `"${st.text}" reopened` : `Completed "${st.text}"`, 'success');
                                      }}
                                      className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                        st.completed
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : 'border-slate-300 dark:border-white/10 hover:border-indigo-500'
                                      }`}
                                    >
                                      {st.completed && <Check className="w-2 h-2" />}
                                    </button>
                                    <span className={`text-xs text-gray-800 dark:text-gray-200 select-none ${st.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'font-medium'}`}>
                                      {st.text}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = subtasks.filter(s => s.id !== st.id);
                                      onTaskUpdate(t.id, { description: serializeDescriptionAndSubtasks(plainDesc, updated) });
                                      toast('Item deleted from checklist', 'info');
                                    }}
                                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 pr-1 cursor-pointer"
                                    title="Delete item"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}

                            {/* Inline creation field */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const text = newSubtaskTexts[t.id] || '';
                                if (!text.trim()) return;
                                const newItem = { id: Math.random().toString(36).slice(2, 9), text: text.trim(), completed: false };
                                const updated = [...subtasks, newItem];
                                onTaskUpdate(t.id, { description: serializeDescriptionAndSubtasks(plainDesc, updated) });
                                setNewSubtaskTexts(prev => ({ ...prev, [t.id]: '' }));
                                toast(`Added checkbox item: "${text.slice(0, 15)}"`, 'success');
                              }}
                              className="flex items-center gap-1.5 pt-2 border-t border-solid border-slate-100 dark:border-white/5"
                            >
                              <input
                                type="text"
                                value={newSubtaskTexts[t.id] || ''}
                                onChange={(e) => setNewSubtaskTexts(prev => ({ ...prev, [t.id]: e.target.value }))}
                                placeholder="Add custom step / checklist item..."
                                className="flex-grow bg-white dark:bg-black/10 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500/40"
                              />
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                Add
                              </button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Info Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* Priority Badge */}
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadgeClass(t.priority)}`}>
                          {t.priority}
                        </span>

                        {/* Category Badge */}
                        <span className="text-[9px] font-bold bg-white/20 border border-white/30 dark:bg-white/5 dark:border-white/5 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 shrink-0 text-indigo-400" />
                          {t.category || 'General'}
                        </span>

                        {/* Due Date Indicator */}
                        {t.due_date && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isOverdue(t) 
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 font-semibold animate-pulse' 
                              : 'bg-white/20 border border-white/30 dark:bg-white/5 dark:border-white/5 text-slate-500 dark:text-gray-400'
                          }`}>
                            <Calendar className="w-2.5 h-2.5 shrink-0" />
                            {isOverdue(t) ? `Overdue: ${formatReadableDate(t.due_date)}` : `Due: ${formatReadableDate(t.due_date)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* EDIT/DELETE ACTIONS */}
                {!isEditing && (
                  <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0">
                    <button
                      onClick={() => onTaskSelect ? onTaskSelect(t) : startEdit(t)}
                      title="Edit task parameters in detailed view"
                      className="p-1.5 hover:bg-white/35 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          onTaskDelete(t.id);
                        }
                      }}
                      title="Delete task card"
                      className="p-1.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER PAGINATION BAR */}
      {filteredTasks.length > pageSize && (
        <div className="flex items-center justify-between pt-4 border-t border-white/25 dark:border-white/10 font-mono">
          <span className="text-xs text-gray-455 dark:text-slate-400">
            Page {currentPage} of {totalPages} ({filteredTasks.length} matches)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 border border-indigo-200/50 dark:border-white/10 bg-white/20 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/45 dark:hover:bg-white/10 transition disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 border border-indigo-200/50 dark:border-white/10 bg-white/20 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/45 dark:hover:bg-white/10 transition disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function onTaskChange(t: Task, newVal: boolean) {
    onTaskUpdate(t.id, { completed: newVal });
    toast(newVal ? `"${t.title}" marked completed!` : `"${t.title}" reopened.`, 'success');
  }

  function formatReadableDate(rawDate: string) {
    if (!rawDate) return '';
    try {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        // Render simple MM/DD
        return `${parts[1]}/${parts[2]}`;
      }
      return new Date(rawDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return rawDate;
    }
  }

  function isOverdue(t: Task) {
    if (t.completed || !t.due_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.due_date < today!;
  }
}
