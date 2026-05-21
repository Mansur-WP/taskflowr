import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  profile_color?: string; // custom profile accent
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  due_date: string; // ISO date string or empty
  created_at: string;
  user_id: string;
  position: number; // for drag and drop ordering
}

interface DatabaseSchema {
  users: User[];
  tasks: Task[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

class DatabaseEngine {
  private schema: DatabaseSchema = { users: [], tasks: [] };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(raw);
        // Ensure schemas have required keys
        if (!this.schema.users) this.schema.users = [];
        if (!this.schema.tasks) this.schema.tasks = [];
      } catch (err) {
        console.error('Error reading JSON database. Initializing empty databases schema.', err);
        this.schema = { users: [], tasks: [] };
        this.save();
      }
    }

    // Preseeding Default Demo Account on mount
    if (this.schema.users.length === 0) {
      const demoHash = this.hashPassword('demo1234');
      this.createUser('DemoUser', 'demo@example.com', demoHash);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed writing to JSON database:', err);
    }
  }

  // PASSWORDS
  public hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + '_todo_salt_').digest('hex');
  }

  // USERS
  public getUsers(): User[] {
    return this.schema.users;
  }

  public getUserById(id: string): User | undefined {
    return this.schema.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.schema.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    return this.schema.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(username: string, email: string, passwordHash: string): User {
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      profile_color: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)]
    };
    this.schema.users.push(newUser);

    // Bootstrap sample tasks for instant analytics and dashboard visual fidelity
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureDateStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sampleTasks: Task[] = [
      {
        id: crypto.randomUUID(),
        title: "✓ Welcome to TaskFlow Workspace!",
        description: "Click the checkbox to the left to mark this task complete and see the dashboard charts update in real time.",
        priority: "low",
        category: "General",
        completed: true,
        due_date: todayStr,
        created_at: new Date().toISOString(),
        user_id: newUser.id,
        position: 1000
      },
      {
        id: crypto.randomUUID(),
        title: "🚀 Finalize system architecture specifications",
        description: "Analyze core microservices, establish dynamic endpoints, and secure token authentication models.",
        priority: "high",
        category: "Work",
        completed: false,
        due_date: tomorrowStr,
        created_at: new Date().toISOString(),
        user_id: newUser.id,
        position: 2000
      },
      {
        id: crypto.randomUUID(),
        title: "📚 Review structural design frameworks",
        description: "Audit development guidelines, optimize asset layouts, and document backend models.",
        priority: "medium",
        category: "Study",
        completed: false,
        due_date: futureDateStr,
        created_at: new Date().toISOString(),
        user_id: newUser.id,
        position: 3000
      }
    ];

    this.schema.tasks.push(...sampleTasks);
    this.save();
    return newUser;
  }

  public updateUser(userId: string, data: Partial<Omit<User, 'id' | 'created_at'>>): User | undefined {
    const userIndex = this.schema.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return undefined;

    this.schema.users[userIndex] = {
      ...this.schema.users[userIndex],
      ...data
    };
    this.save();
    return this.schema.users[userIndex];
  }

  // TASKS
  public getTasks(userId: string): Task[] {
    // Return sorted tasks based on position
    return this.schema.tasks
      .filter(t => t.user_id === userId)
      .sort((a, b) => a.position - b.position);
  }

  public getTaskById(taskId: string): Task | undefined {
    return this.schema.tasks.find(t => t.id === taskId);
  }

  public createTask(userId: string, params: Omit<Task, 'id' | 'created_at' | 'user_id' | 'position'>): Task {
    const userTasks = this.getTasks(userId);
    // Position at the bottom of the list (max position + 1000)
    const maxPos = userTasks.reduce((max, t) => t.position > max ? t.position : max, 0);
    const newPos = maxPos + 1000;

    const newTask: Task = {
      ...params,
      id: crypto.randomUUID(),
      user_id: userId,
      position: newPos,
      created_at: new Date().toISOString()
    };

    this.schema.tasks.push(newTask);
    this.save();
    return newTask;
  }

  public updateTask(taskId: string, params: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>): Task | undefined {
    const taskIndex = this.schema.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return undefined;

    this.schema.tasks[taskIndex] = {
      ...this.schema.tasks[taskIndex],
      ...params
    };
    this.save();
    return this.schema.tasks[taskIndex];
  }

  public deleteTask(taskId: string): boolean {
    const originalLength = this.schema.tasks.length;
    this.schema.tasks = this.schema.tasks.filter(t => t.id !== taskId);
    const deleted = this.schema.tasks.length < originalLength;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  // Reorder task positions
  public reorderTasks(userId: string, taskIdsOrdered: string[]): boolean {
    const userTasks = this.getTasks(userId);
    
    // Check if lengths and IDs match up
    taskIdsOrdered.forEach((id, index) => {
      const task = this.schema.tasks.find(t => t.id === id && t.user_id === userId);
      if (task) {
        task.position = (index + 1) * 1000;
      }
    });

    this.save();
    return true;
  }

  // ANALYTICS AND METRICS
  public getAnalytics(userId: string) {
    const tasks = this.getTasks(userId);
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Priority distributes
    const priorityCounts = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length
    };

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    tasks.forEach(t => {
      const cat = t.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Completed ratio vs date overview (mock over last 7 days)
    return {
      total,
      completed,
      pending,
      priorityCounts,
      categoryCounts,
    };
  }

  // CSV EXPORT GENERATOR
  public exportTasksToCSV(userId: string): string {
    const tasks = this.getTasks(userId);
    const headers = ['Task ID', 'Title', 'Description', 'Priority', 'Category', 'Completed', 'Due Date', 'Created At'];
    
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.priority,
      `"${(t.category || 'General').replace(/"/g, '""')}"`,
      t.completed ? 'YES' : 'NO',
      t.due_date || 'N/A',
      t.created_at
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Simulate pending alerts (Task email reminder sim/notifications)
  public getReminders(userId: string) {
    const tasks = this.getTasks(userId);
    const now = new Date();
    const imminentTasks = tasks.filter(t => {
      if (t.completed || !t.due_date) return false;
      const due = new Date(t.due_date);
      const diffMs = due.getTime() - now.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      // Alerts inside next 48 hours and not expired
      return diffHrs > -2 && diffHrs < 48;
    });

    return imminentTasks.map(t => ({
      taskId: t.id,
      title: t.title,
      dueDate: t.due_date,
      type: 'email_alert',
      message: `Friendly Reminder: your task "${t.title}" is due on ${new Date(t.due_date).toLocaleDateString()}.`
    }));
  }
}

export const db = new DatabaseEngine();
