import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Tag, 
  Trash2, 
  Edit3, 
  Check, 
  SlidersHorizontal,
  Clock,
  Briefcase,
  ListTodo,
  MoreVertical,
  Flame,
  AlertCircle,
  FolderOpen,
  CalendarDays,
  User as UserIcon,
  Sparkles,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Task, User } from '../types.js';
import { 
  parseTaskMetadata, 
  serializeTaskMetadata, 
  pushActivityLog, 
  Subtask, 
  ActivityLog, 
  AssignedUser, 
  TaskMetadata 
} from '../utils/taskMeta.js';

interface TaskListViewProps {
  tasks: Task[];
  user: User;
  onTaskCreate: (taskData: Omit<Task, 'id' | 'created_at' | 'user_id' | 'position'>) => Promise<boolean>;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
  onTasksReorder: (ids: string[]) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onTaskSelect?: (task: Task) => void;
  onBulkDelete?: (type: 'completed' | 'all') => void;
  autoDeleteOnFinish?: boolean;
  onToggleAutoDelete?: () => void;
  sidebarCategoryFilter?: string;
  onSelectProject?: (project: string) => void;
}

export default function TaskListView({
  tasks,
  user,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTasksReorder,
  toast,
  onTaskSelect,
  onBulkDelete,
  autoDeleteOnFinish = false,
  onToggleAutoDelete,
  sidebarCategoryFilter = 'all',
  onSelectProject
}: TaskListViewProps) {
  
  // Tab states for filters: 'all' | 'active' | 'high' | 'project'
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'high' | 'project'>('all');
  const [selectedProjectTab, setSelectedProjectTab] = useState<string>('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Task for right-side inline details panel
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Synced selected task object derived from source tasks props
  const activeTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // If sidebarCategoryFilter changes, sync selectedProjectTab
  useEffect(() => {
    if (sidebarCategoryFilter && sidebarCategoryFilter !== 'all') {
      setFilterTab('project');
      setSelectedProjectTab(sidebarCategoryFilter);
    } else if (sidebarCategoryFilter === 'all') {
      setFilterTab('all');
    }
  }, [sidebarCategoryFilter]);

  // Today Date string ISO
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Calculate Streak locally to keep state updated
  const streakCount = useMemo(() => {
    const saved = localStorage.getItem('productivity_streak');
    if (saved) return parseInt(saved, 10);
    // Otherwise seed a default
    localStorage.setItem('productivity_streak', '5');
    return 5;
  }, []);

  // Increment streak in local storage or visual feed upon completion events
  const triggerStreakJoy = () => {
    const nextStreak = streakCount + 1;
    localStorage.setItem('productivity_streak', String(nextStreak));
  };

  // Extract list of all unique categories
  const allCategories = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.category || 'Work'))).filter(Boolean);
  }, [tasks]);

  // Handle click-to-confirm bulk delete action elements
  const [confirmClearCompleted, setConfirmClearCompleted] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // QUICK ADD FORWARD-BAR STATE
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [quickCategory, setQuickCategory] = useState('Work');
  const [quickDueDate, setQuickDueDate] = useState('');

  // Dropdown UI toggles in Quick-Add Bar
  const [showPriorityDrop, setShowPriorityDrop] = useState(false);
  const [showCategoryDrop, setShowCategoryDrop] = useState(false);
  const [showDateDrop, setShowDateDrop] = useState(false);

  // Inline details panel custom inputs
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showAssigneeDrop, setShowAssigneeDrop] = useState(false);

  // Inline editing mode for selected tasks
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleBuffer, setEditTitleBuffer] = useState('');

  // Dynamic assignee - restricted only to your logged in account details and data
  const presetAssignees: AssignedUser[] = [
    { username: `${user.username} (You)`, profileColor: user.profile_color || '#8b5cf6', email: user.email }
  ];

  // Primary filtering logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search text matches
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Tab Filters
      if (filterTab === 'active') {
        return !t.completed;
      }
      if (filterTab === 'high') {
        return t.priority === 'high';
      }
      if (filterTab === 'project') {
        if (selectedProjectTab === 'all') return true;
        return t.category === selectedProjectTab;
      }

      return true;
    });
  }, [tasks, filterTab, selectedProjectTab, searchQuery]);

  // Divide into Today section and Overdue section & Backlog/Later section
  const categorizedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const later: Task[] = [];
    const completed: Task[] = [];

    filteredTasks.forEach((t) => {
      if (t.completed) {
        completed.push(t);
      } else if (t.due_date && t.due_date < todayStr) {
        overdue.push(t);
      } else if (t.due_date === todayStr || !t.due_date) {
        todayTasks.push(t);
      } else {
        later.push(t);
      }
    });

    return { overdue, todayTasks, later, completed };
  }, [filteredTasks, todayStr]);

  // Overall metrics calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const inProgress = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && t.due_date && t.due_date < todayStr).length;
    return { total, completed, inProgress, overdue };
  }, [tasks, todayStr]);

  // Handle Quick Add Submit
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Create default activity logs
    const initialActivity: ActivityLog[] = [
      {
        id: Math.random().toString(36).slice(2, 9),
        text: 'Task initialized via Workspace Fast-Add',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    const initialMeta: TaskMetadata = {
      description: '',
      subtasks: [],
      assigned: null,
      activity: initialActivity
    };

    const success = await onTaskCreate({
      title: quickTitle.trim(),
      description: serializeTaskMetadata(initialMeta),
      priority: quickPriority,
      category: quickCategory,
      due_date: quickDueDate,
      completed: false
    });

    if (success) {
      setQuickTitle('');
      setQuickPriority('medium');
      setQuickDueDate('');
      setShowPriorityDrop(false);
      setShowCategoryDrop(false);
      setShowDateDrop(false);
      toast(`Quick-queued task card!`, 'success');
    }
  };

  // Toggle checklist status in inline details panel
  const handleToggleSubtask = (subId: string, currentVal: boolean) => {
    if (!activeTask) return;
    const meta = parseTaskMetadata(activeTask.description || '');
    
    const updatedSubtasks = meta.subtasks.map(s => 
      s.id === subId ? { ...s, completed: !currentVal } : s
    );

    const updatedActivity = pushActivityLog(
      meta.activity,
      `Checklist item: "${meta.subtasks.find(s => s.id === subId)?.text.slice(0, 15)}..." marked ${!currentVal ? 'completed' : 'reopened'}`
    );

    const newDescription = serializeTaskMetadata({
      ...meta,
      subtasks: updatedSubtasks,
      activity: updatedActivity
    });

    onTaskUpdate(activeTask.id, { description: newDescription });
    toast(!currentVal ? 'Checklist checkpoint ticked!' : 'Checkpoint reopened', 'info');
  };

  // Add subtask in inline details panel
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newSubtaskText.trim()) return;

    const meta = parseTaskMetadata(activeTask.description || '');
    const newSub: Subtask = {
      id: Math.random().toString(36).slice(2, 9),
      text: newSubtaskText.trim(),
      completed: false
    };

    const updatedSubtasks = [...meta.subtasks, newSub];
    const updatedActivity = pushActivityLog(meta.activity, `Checklist item added: "${newSub.text.slice(0, 20)}"`);

    const newDescription = serializeTaskMetadata({
      ...meta,
      subtasks: updatedSubtasks,
      activity: updatedActivity
    });

    onTaskUpdate(activeTask.id, { description: newDescription });
    setNewSubtaskText('');
    toast('Checklist checkpoint queued!', 'success');
  };

  // Change assignee inside details panel
  const handleChangeAssignee = (user: AssignedUser | null) => {
    if (!activeTask) return;
    const meta = parseTaskMetadata(activeTask.description || '');

    const updatedActivity = pushActivityLog(
      meta.activity,
      user ? `Assigned task to ${user.username}` : 'Removed assignee from task'
    );

    const newDescription = serializeTaskMetadata({
      ...meta,
      assigned: user,
      activity: updatedActivity
    });

    onTaskUpdate(activeTask.id, { description: newDescription });
    setShowAssigneeDrop(false);
    toast(user ? `Assigned to ${user.username}` : 'Unassigned', 'info');
  };

  // Edit details inside panel
  const handleInlineTitleSave = () => {
    if (!activeTask || !editTitleBuffer.trim()) return;
    const meta = parseTaskMetadata(activeTask.description || '');

    const updatedActivity = pushActivityLog(
      meta.activity,
      `Renamed task to "${editTitleBuffer.trim()}"`
    );

    const newDescription = serializeTaskMetadata({
      ...meta,
      activity: updatedActivity
    });

    onTaskUpdate(activeTask.id, { 
      title: editTitleBuffer.trim(),
      description: newDescription
    });
    setIsEditingTitle(false);
    toast('Task renamed', 'success');
  };

  // Interactive detail toggle events
  const handleFieldChange = (field: 'priority' | 'due_date' | 'category', value: string) => {
    if (!activeTask) return;
    const meta = parseTaskMetadata(activeTask.description || '');

    const formattedLabel = field.replace('_', ' ').toUpperCase();
    const updatedActivity = pushActivityLog(
      meta.activity,
      `Updated ${formattedLabel} to "${value}"`
    );

    const newDescription = serializeTaskMetadata({
      ...meta,
      activity: updatedActivity
    });

    onTaskUpdate(activeTask.id, { 
      [field]: value,
      description: newDescription
    });
    
    toast(`Task ${formattedLabel} updated`, 'success');
  };

  // Delete checklist item
  const handleDeleteChecklistSubtask = (subId: string) => {
    if (!activeTask) return;
    const meta = parseTaskMetadata(activeTask.description || '');
    const item = meta.subtasks.find(s => s.id === subId);
    if (!item) return;

    const updatedSubtasks = meta.subtasks.filter(s => s.id !== subId);
    const updatedActivity = pushActivityLog(meta.activity, `Deleted checklist item: "${item.text.slice(0, 15)}"`);

    const newDescription = serializeTaskMetadata({
      ...meta,
      subtasks: updatedSubtasks,
      activity: updatedActivity
    });

    onTaskUpdate(activeTask.id, { description: newDescription });
    toast('Checklist item removed', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. STATS ROW AT THE TOP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            title: 'Completed', 
            val: stats.completed, 
            caption: 'Tackled tasks',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/15'
          },
          { 
            title: 'In Progress', 
            val: stats.inProgress, 
            caption: 'Active focus queue',
            color: 'text-[#6366f1]',
            bg: 'bg-[#6366f1]/10 border-[#6366f1]/15'
          },
          { 
            title: 'Overdue', 
            val: stats.overdue, 
            caption: 'Immediate priority',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10 border-rose-500/15'
          },
          { 
            title: 'Streak', 
            val: `${streakCount} days`, 
            caption: 'Daily record burner',
            color: 'text-[#3b82f6]',
            bg: 'bg-[#3b82f6]/10 border-[#3b82f6]/15',
            icon: true
          }
        ].map((item, idx) => (
          <div 
            key={idx} 
            className={`border rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden backdrop-blur-md transition-all hover:scale-[1.01] ${item.bg}`}
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 tracking-widest font-mono">
              {item.title}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl sm:text-3.5xl font-extrabold tracking-tight font-display ${item.color}`}>
                {item.val}
              </span>
              {item.icon && <Flame className="w-5 h-5 text-amber-500 animate-bounce shrink-0 mt-1" />}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-slate-500 font-semibold mt-1">
              {item.caption}
            </span>
          </div>
        ))}
      </div>

      {/* SPLIT LAYOUT WORKSPACE FOR INLINE DETAILED FLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: FILTERS, QUICK ADD & TODAY SECTIONS (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* FILTER TAB SELECTORS */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 gap-3 bg-white/40 dark:bg-black/10 p-3 rounded-2xl backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Tasks', total: tasks.length },
                { id: 'active', label: 'Active', total: tasks.filter(t => !t.completed).length },
                { id: 'high', label: 'High Priority', total: tasks.filter(t => t.priority === 'high').length },
                { id: 'project', label: 'Projects', total: allCategories.length }
              ].map((tab) => {
                const isActive = filterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFilterTab(tab.id as any);
                      if (tab.id === 'project' && selectedProjectTab === 'all' && allCategories.length > 0) {
                        setSelectedProjectTab(allCategories[0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-md shadow-[#8b5cf6]/20' 
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-gray-500 dark:text-slate-500'
                    }`}>
                      {tab.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* If Project select filter tab is activated */}
            {filterTab === 'project' && allCategories.length > 0 && (
              <div className="flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#3b82f6]" />
                <select
                  value={selectedProjectTab}
                  onChange={(e) => {
                    setSelectedProjectTab(e.target.value);
                    if (onSelectProject) onSelectProject(e.target.value);
                  }}
                  className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer border-none"
                >
                  <option value="all" className="dark:bg-[#0c0d12]">Any Project</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat} className="dark:bg-[#0c0d12]">{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Direct bulk clear action inline popup */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmClearCompleted(!confirmClearCompleted)}
                title="Flush completed"
                className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-[#3b82f6] transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Confirm box overlays rendering */}
          {confirmClearCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Confirm wiping all COMPLETED items? This action is permanent.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onBulkDelete?.('completed');
                    setConfirmClearCompleted(false);
                    toast('Completed tasks cleared', 'success');
                  }}
                  className="px-2.5 py-1 bg-amber-600 font-bold hover:bg-amber-700 text-white rounded-lg transition"
                >
                  Clear Completed
                </button>
                <button
                  onClick={() => setConfirmClearCompleted(false)}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* SEARCH BAR INTEGRATION */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#6366f1] dark:text-[#3b82f6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#0c0d12]/50 text-gray-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366f1]"
              placeholder="Search active tasks list by text query..."
            />
          </div>

          {/* 2. QUICK-ADD INTERACTIVE BAR */}
          <form 
            onSubmit={handleQuickAddSubmit} 
            className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white/60 dark:bg-[#0c0d12]/60 p-2 shadow-sm space-y-2 backdrop-blur-md relative"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                required
                className="flex-grow bg-transparent text-xs sm:text-sm px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none font-medium"
                placeholder="Add task (e.g., Deliver design tomorrow #Work !high)"
              />
              <button
                type="submit"
                className="p-2 border border-[#8b5cf6]/20 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white rounded-xl hover:scale-[1.03] transition-transform flex items-center justify-center cursor-pointer shadow-md shadow-[#8b5cf6]/10 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
              </button>
            </div>

            {/* META BUTTONS ROW */}
            <div className="flex items-center gap-1.5 px-1 border-t border-slate-100 dark:border-white/5 pt-2 flex-wrap">
              
              {/* Priority Select Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityDrop(!showPriorityDrop);
                    setShowCategoryDrop(false);
                    setShowDateDrop(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 text-gray-500 dark:text-slate-400 ${
                    quickPriority !== 'medium' ? 'text-[#6366f1] border-[#6366f1]/20 bg-[#6366f1]/5' : ''
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    quickPriority === 'high' ? 'bg-rose-500' : quickPriority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <span>Priority: {quickPriority.toUpperCase()}</span>
                </button>
                {showPriorityDrop && (
                  <div className="absolute left-0 bottom-full mb-2 z-30 bg-white dark:bg-[#12131b] border border-slate-200 dark:border-white/10 p-1.5 rounded-xl shadow-xl flex flex-col gap-1 w-32">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setQuickPriority(p as any);
                          setShowPriorityDrop(false);
                        }}
                        className="px-2 py-1.5 rounded-lg text-left text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-[#6366f1] transition"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Select Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryDrop(!showCategoryDrop);
                    setShowPriorityDrop(false);
                    setShowDateDrop(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 text-gray-500 dark:text-slate-400 ${
                    quickCategory !== 'Work' ? 'text-[#6366f1] border-[#6366f1]/20 bg-[#6366f1]/5' : ''
                  }`}
                >
                  <FolderOpen className="w-3 h-3 text-gray-400" />
                  <span>Project: {quickCategory}</span>
                </button>
                {showCategoryDrop && (
                  <div className="absolute left-0 bottom-full mb-2 z-30 bg-white dark:bg-[#12131b] border border-slate-200 dark:border-white/10 p-2 rounded-xl shadow-xl flex flex-col gap-1 w-44">
                    <span className="text-[9px] text-gray-400 px-1 font-bold">SELECT OR ENTER:</span>
                    <input
                      type="text"
                      value={quickCategory}
                      onChange={(e) => setQuickCategory(e.target.value)}
                      className="px-2 py-1 bg-black/10 dark:bg-black/25 text-[10px] border border-white/10 rounded-lg text-white mb-1"
                      placeholder="Custom category..."
                    />
                    {['Work', 'Personal', 'Shopping', 'Health'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setQuickCategory(cat);
                          setShowCategoryDrop(false);
                        }}
                        className="px-2 py-1 rounded-lg text-left text-[10px] text-gray-400 hover:text-white hover:bg-[#6366f1] transition"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Date Timer */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowDateDrop(!showDateDrop);
                    setShowPriorityDrop(false);
                    setShowCategoryDrop(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 text-gray-500 dark:text-slate-400 ${
                    quickDueDate !== '' ? 'text-[#6366f1] border-[#6366f1]/20 bg-[#6366f1]/5' : ''
                  }`}
                >
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>Due: {quickDueDate || 'None'}</span>
                </button>
                {showDateDrop && (
                  <div className="absolute left-0 bottom-full mb-2 z-30 bg-white dark:bg-[#12131b] border border-slate-200 dark:border-white/10 p-2 rounded-xl shadow-xl flex flex-col gap-1 w-48">
                    <input
                      type="date"
                      value={quickDueDate}
                      onChange={(e) => setQuickDueDate(e.target.value)}
                      className="px-2 py-1 bg-black/15 text-[10px] border border-white/10 rounded-lg text-white mb-2 font-mono"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => { setQuickDueDate(todayStr); setShowDateDrop(false); }}
                        className="text-[9px] px-1.5 py-1 bg-[#6366f1] text-white rounded font-bold"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => { setQuickDueDate(''); setShowDateDrop(false); }}
                        className="text-[9px] px-1.5 py-1 bg-slate-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded font-bold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </form>

          {/* 3. CORE TASKS LIST WORKSPACE */}
          <div className="space-y-6">

            {/* OVERDUE SECTION (Flagged Red - glows & draws attention) */}
            {categorizedTasks.overdue.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 block shrink-0 animate-ping" />
                  <h3 className="text-xs font-black uppercase text-rose-500 tracking-wider font-display">
                    Overdue ({categorizedTasks.overdue.length})
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {categorizedTasks.overdue.map(t => (
                    <TaskCard 
                      key={t.id} 
                      task={t} 
                      selectedTaskId={selectedTaskId}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onTaskUpdate={onTaskUpdate}
                      onTaskDelete={onTaskDelete}
                      toast={toast}
                      triggerStreakJoy={triggerStreakJoy}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TODAY SECTION */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6] block shrink-0" />
                  <h3 className="text-xs font-black uppercase text-gray-800 dark:text-slate-300 tracking-wider font-display">
                    Today / Focus List ({categorizedTasks.todayTasks.length})
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono font-semibold">
                  {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {categorizedTasks.todayTasks.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-transparent">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-gray-400">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-gray-500 dark:text-slate-400">All planned tasks for today completed!</p>
                  <p className="text-[10px] text-gray-400 mt-1">Excellent work. Use the quick-add bar above to queue more items.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categorizedTasks.todayTasks.map(t => (
                    <TaskCard 
                      key={t.id} 
                      task={t} 
                      selectedTaskId={selectedTaskId}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onTaskUpdate={onTaskUpdate}
                      onTaskDelete={onTaskDelete}
                      toast={toast}
                      triggerStreakJoy={triggerStreakJoy}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* LATER / BACKLOG SECTION */}
            {categorizedTasks.later.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6366f1] block shrink-0" />
                  <h3 className="text-xs font-black uppercase text-gray-400 dark:text-slate-400 tracking-wider font-display">
                    Later / Backlog ({categorizedTasks.later.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {categorizedTasks.later.map(t => (
                    <TaskCard 
                      key={t.id} 
                      task={t} 
                      selectedTaskId={selectedTaskId}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onTaskUpdate={onTaskUpdate}
                      onTaskDelete={onTaskDelete}
                      toast={toast}
                      triggerStreakJoy={triggerStreakJoy}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED SECTION */}
            {categorizedTasks.completed.length > 0 && (
              <div className="space-y-2.5 opacity-60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider font-display">
                    Completed Archive ({categorizedTasks.completed.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {categorizedTasks.completed.map(t => (
                    <TaskCard 
                      key={t.id} 
                      task={t} 
                      selectedTaskId={selectedTaskId}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onTaskUpdate={onTaskUpdate}
                      onTaskDelete={onTaskDelete}
                      toast={toast}
                      triggerStreakJoy={triggerStreakJoy}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* 4. RIGHT-SIDE INLINE DETAIL PANEL (Col span 5 - highly advanced) */}
        <div className="lg:col-span-5 h-full lg:sticky lg:top-4 bg-[#ffffff]/80 dark:bg-[#0c0d12]/90 border border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-lg shadow-black/20 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {!activeTask ? (
              <motion.div 
                key="empty-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8b5cf6]/10 to-[#06b6d4]/10 dark:from-[#8b5cf6]/10 dark:to-[#06b6d4]/10 flex items-center justify-center border border-[#8b5cf6]/25">
                  <Sparkles className="w-6 h-6 text-[#8b5cf6] dark:text-[#06b6d4] animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase font-mono tracking-widest">
                    Select a Task Card
                  </h4>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 max-w-xs mt-1 leading-normal font-semibold">
                    Hover-reveal and click any card in your Today or Backlog feeds to view the full checklists, progress logs, assignee widgets, and core activity logs inline below!
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={activeTask.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Task Title panel block */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#8b5cf6] dark:text-[#06b6d4]">
                      Task Details Workspace
                    </span>
                    <button
                      onClick={() => setSelectedTaskId(null)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-gray-400 hover:text-white transition font-mono"
                    >
                      ESC Close
                    </button>
                  </div>
 
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editTitleBuffer}
                        onChange={(e) => setEditTitleBuffer(e.target.value)}
                        className="flex-grow bg-[#0c0d12]/60 px-2 py-1 border border-[#8b5cf6] rounded-lg text-xs leading-normal font-bold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInlineTitleSave();
                          if (e.key === 'Escape') setIsEditingTitle(false);
                        }}
                      />
                      <button 
                        onClick={handleInlineTitleSave}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 
                      onClick={() => {
                        setEditTitleBuffer(activeTask.title);
                        setIsEditingTitle(true);
                      }}
                      className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug cursor-text hover:text-[#8b5cf6] dark:hover:text-[#06b6d4] transition font-display"
                    >
                      {activeTask.title}
                    </h3>
                  )}
                </div>
 
                {/* SUBTASK PROGRESS METER */}
                {(() => {
                  const { subtasks } = parseTaskMetadata(activeTask.description || '');
                  const total = subtasks.length;
                  const completed = subtasks.filter(s => s.completed).length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
 
                  return (
                    <div className="space-y-1.5 p-3.5 bg-slate-100/40 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-400 uppercase tracking-widest font-mono">Progress Metric</span>
                        <span className="text-[#8b5cf6] dark:text-[#06b6d4]">{completed}/{total} Checklist Checkpoints ({percent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* CORES OVERALL META DETAILS ASSIGNED GRID */}
                <div className="space-y-2 p-3.5 bg-slate-100/40 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl text-[11px] font-bold">
                  <span className="text-gray-400 uppercase tracking-widest font-mono block pb-1 border-b border-white/5">
                    Metadata Specification
                  </span>
                  
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 pt-1 font-semibold">
                    
                    {/* Due date field */}
                    <div className="text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Due Date</span>
                    </div>
                    <div>
                      <input 
                        type="date"
                        value={activeTask.due_date || ''}
                        onChange={(e) => handleFieldChange('due_date', e.target.value)}
                        className="bg-transparent text-gray-800 dark:text-gray-200 border-none px-0.5 focus:outline-none w-full text-right font-mono"
                      />
                    </div>

                    {/* Priority Selector buttons */}
                    <div className="text-gray-400 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                      <span>Priority</span>
                    </div>
                    <div className="text-right">
                      <select
                        value={activeTask.priority}
                        onChange={(e) => handleFieldChange('priority', e.target.value)}
                        className="bg-transparent text-gray-800 dark:text-gray-200 border-none focus:outline-none focus:ring-0 text-right text-[10px] uppercase font-bold"
                      >
                        <option value="low" className="dark:bg-[#0c0d12]">Low</option>
                        <option value="medium" className="dark:bg-[#0c0d12]">Medium</option>
                        <option value="high" className="dark:bg-[#0c0d12]">High</option>
                      </select>
                    </div>

                    {/* Project/Category Field */}
                    <div className="text-gray-400 flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>Project Name</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={activeTask.category || 'General'}
                        onChange={(e) => handleFieldChange('category', e.target.value)}
                        className="bg-transparent text-gray-800 dark:text-gray-200 border-none px-0.5 focus:outline-none w-full text-right focus:border-b focus:border-white/20"
                        placeholder="Tag project..."
                      />
                    </div>

                    {/* Assigned User Widget */}
                    <div className="text-gray-400 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Assigned To</span>
                    </div>
                    <div className="text-right relative">
                      {(() => {
                        const meta = parseTaskMetadata(activeTask.description || '');
                        return (
                          <div>
                            <button
                              type="button"
                              onClick={() => setShowAssigneeDrop(!showAssigneeDrop)}
                              className="text-[10px] uppercase text-[#6366f1] dark:text-[#3b82f6] font-black focus:outline-none hover:underline"
                            >
                              {meta.assigned ? meta.assigned.username : 'UNASSIGNED'}
                            </button>
                            {showAssigneeDrop && (
                              <div className="absolute right-0 top-full mt-1.5 z-40 bg-white dark:bg-[#12131b] border border-slate-200 dark:border-white/10 p-1.5 rounded-xl shadow-xl w-44 flex flex-col gap-1 text-left">
                                <span className="text-[9px] text-gray-400 px-1 font-bold">CHOOSE PERSON:</span>
                                <button
                                  type="button"
                                  onClick={() => handleChangeAssignee(null)}
                                  className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-rose-500/10 rounded-lg text-left"
                                >
                                  UNASSIGN (NONE)
                                </button>
                                {presetAssignees.map(user => (
                                  <button
                                    key={user.username}
                                    type="button"
                                    onClick={() => handleChangeAssignee(user)}
                                    className="px-2 py-1.5 rounded-lg text-left text-[10px] text-gray-400 hover:text-white hover:bg-[#6366f1] transition font-bold"
                                  >
                                    {user.username}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>

                {/* DETAILED SUBTASK CHECKLIST */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">
                    Checklist Checkpoints
                  </h4>

                  {/* Add Checkpoint Form */}
                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      placeholder="Add checklist checkpoint item..."
                      className="flex-grow bg-[#0c0d12]/40 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#6366f1]"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-[#6366f1] text-white text-xs font-bold rounded-xl hover:bg-indigo-500 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  {/* Checklist listings */}
                  {(() => {
                    const meta = parseTaskMetadata(activeTask.description || '');
                    return (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {meta.subtasks.length === 0 ? (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold italic text-center py-2">
                            No checkpoint checkpoints yet. Type and add one above!
                          </p>
                        ) : (
                          meta.subtasks.map(sub => (
                            <div 
                              key={sub.id} 
                              className="flex items-center justify-between gap-2 p-1.5 bg-slate-500/5 hover:bg-slate-500/10 rounded-xl group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubtask(sub.id, sub.completed)}
                                  className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                                    sub.completed 
                                      ? 'bg-gradient-to-tr from-[#6366f1] to-[#3b82f6] border-opacity-0 text-white' 
                                      : 'border-slate-350 dark:border-white/5 hover:border-[#6366f1]'
                                  }`}
                                >
                                  {sub.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                                </button>
                                <span className={`text-[11px] font-semibold truncate ${
                                  sub.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-slate-200'
                                }`}>
                                  {sub.text}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteChecklistSubtask(sub.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 rounded text-rose-500 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* CHRONOLOGICAL ACTIVITY LOG */}
                <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Audit Activity Log</span>
                  </div>

                  {(() => {
                    const meta = parseTaskMetadata(activeTask.description || '');
                    return (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1 font-mono text-[9px] font-semibold">
                        {meta.activity.length === 0 ? (
                          <p className="text-gray-500 dark:text-slate-500 italic py-1">No chronological edits recorded yet.</p>
                        ) : (
                          meta.activity.map(log => (
                            <div key={log.id} className="flex items-start justify-between gap-2 text-gray-400 dark:text-slate-400 border-b border-white/5 pb-1">
                              <span className="truncate leading-normal">{log.text}</span>
                              <span className="shrink-0 text-[#6366f1] dark:text-[#3b82f6] font-bold">{log.timestamp}</span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}

// ==========================================
// SUB-COMPONENT: PORTABLE TASK CARD WITH DETECTIVES OVERHOVERS
// ==========================================
interface TaskCardProps {
  key?: any;
  task: Task;
  selectedTaskId: string | null;
  onSelect: () => void;
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info') => void;
  triggerStreakJoy: () => void;
}

function TaskCard({
  task,
  selectedTaskId,
  onSelect,
  onTaskUpdate,
  onTaskDelete,
  toast,
  triggerStreakJoy
}: TaskCardProps) {
  
  const isSelected = selectedTaskId === task.id;

  // Track state for completion pop animation
  const [popClicked, setPopClicked] = useState(false);

  // Parse custom metadata
  const meta = useMemo(() => {
    return parseTaskMetadata(task.description || '');
  }, [task.description]);

  // Priority color config
  const getPriorityDot = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500 ring-4 ring-rose-500/10';
      case 'medium': return 'bg-amber-500 ring-4 ring-amber-500/10';
      default: return 'bg-slate-500 ring-4 ring-slate-500/10';
    }
  };

  const formattedDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      return `${parts[1]}/${parts[2]}`;
    } catch {
      return dStr;
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopClicked(true);
    const nextVal = !task.completed;
    onTaskUpdate(task.id, { completed: nextVal });

    if (nextVal) {
      triggerStreakJoy();
      toast(`Excellent! Task "${task.title.slice(0, 18)}" tackled! Streak ticking 🔥`, 'success');
    } else {
      toast('Task reopened', 'info');
    }

    setTimeout(() => {
      setPopClicked(false);
    }, 600);
  };

  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ y: -1 }}
      className={`border rounded-2xl p-3.5 flex items-start justify-between gap-3 cursor-pointer group transition-all relative overflow-hidden backdrop-blur-md ${
        isSelected 
          ? 'bg-gradient-to-r from-[#8b5cf6]/10 to-[#06b6d4]/10 border-[#8b5cf6]/30 dark:border-[#8b5cf6]/30 shadow-md' 
          : 'bg-white/70 dark:bg-[#110b2b]/60 hover:bg-[#170f3b]/80 border-slate-200 dark:border-white/5 hover:border-[#8b5cf6]/20'
      } ${task.completed ? 'opacity-85' : ''}`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-grow">
        
        {/* CHECKBOX POP ANIMATION */}
        <div className="pt-0.5 shrink-0" onClick={handleCheckboxClick}>
          <motion.div
            animate={popClicked ? { scale: [1, 1.4, 0.9, 1.1, 1], rotate: [0, 8, -8, 0] } : {}}
            transition={{ duration: 0.5, type: 'spring' }}
            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition shrink-0 cursor-pointer ${
              task.completed 
                ? 'bg-gradient-to-tr from-[#8b5cf6] to-[#06b6d4] border-opacity-0 text-white font-extrabold' 
                : 'border-slate-350 dark:border-white/10 hover:border-[#8b5cf6] bg-white/5'
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
          </motion.div>
        </div>

        {/* DETAILS SECTION */}
        <div className="min-w-0 flex-grow space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* PRIORITY GLOW DOT */}
            <span className={`w-1.5 h-1.5 rounded-full block shrink-0 ${getPriorityDot(task.priority)}`} />
            
            <h4 className={`text-xs font-bold transition-all truncate leading-relaxed ${
              task.completed ? 'line-through text-gray-500' : 'text-gray-950 dark:text-slate-100'
            }`}>
              {task.title}
            </h4>
          </div>

          {/* SUBTASK INLINE SEGMENTED PROGRESS BARS */}
          {meta.subtasks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 font-mono font-bold uppercase shrink-0">
                Steps: {meta.subtasks.filter(s => s.completed).length}/{meta.subtasks.length}
              </span>
              
              {/* SLENDER STEP SEGMENTS (highly slick look representing blocks filled or empty) */}
              <div className="flex items-center gap-1 flex-grow max-w-24">
                {meta.subtasks.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className={`h-1 flex-grow rounded-full transition-colors ${
                      sub.completed 
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]' 
                        : 'bg-slate-200 dark:bg-white/5'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PROJECT / DUE DATE BADGES */}
          <div className="flex items-center gap-1.5 select-none text-[9px] font-bold flex-wrap">
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-gray-400 uppercase tracking-widest font-mono">
              {task.category || 'General'}
            </span>
            {task.due_date && (
              <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-mono ${
                task.due_date < new Date().toISOString().split('T')[0] && !task.completed
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-gray-400 border border-slate-200 dark:border-white/5'
              }`}>
                <Calendar className="w-2.5 h-2.5" />
                <span>{formattedDate(task.due_date)}</span>
              </span>
            )}
            {meta.assigned && (
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center gap-1 shrink-0">
                <UserCheck className="w-2.5 h-2.5" />
                <span>{meta.assigned.username.split(' ')[0]}</span>
              </span>
            )}
          </div>

        </div>

      </div>

      {/* HOVER-REVEAL ACTION BUTTON BAR */}
      <div 
        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          title="Micro Details inline"
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-[#8b5cf6] transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Permanently purge this task card?')) onTaskDelete(task.id);
          }}
          title="Delete task card"
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </motion.div>
  );
}
