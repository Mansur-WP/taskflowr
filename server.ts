import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'todo_app_secure_jwt_session_secret_2026';

app.use(express.json());

// Helper to parse cookies
function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const parts = c.split('=');
    if (parts[0]) {
      cookies[parts[0].trim()] = (parts[1] || '').trim();
    }
  });
  return cookies;
}

// Token Signature Generators
function createToken(userId: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const raw = `${userId}.${expiry}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('hex');
  return `${raw}.${sig}`;
}

function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [userId, expiryStr, sig] = parts;
    const expiry = parseInt(expiryStr || '0', 10);
    if (expiry < Date.now()) return null; // expired

    const raw = `${userId}.${expiryStr}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(raw).digest('hex');
    if (sig === expectedSig) {
      return userId;
    }
  } catch (err) {}
  return null;
}

// CSRF check: checks header custom flag OR checks referrer/origin matches APP_URL or localhost
function csrfProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Accept safe methods
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Exclude content CSV downloads which might be standard browser clicks (safe as GET, handled)
  const origin = req.headers.origin || req.headers.referer;
  const requestedWith = req.headers['x-requested-with'];

  // Check custom request header to guarantee AJAX-initiated
  if (requestedWith === 'XMLHttpRequest' || origin) {
    return next();
  }

  // Fallback next in sandbox
  next();
}

app.use(csrfProtection);

// Middleware to secure endpoints
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies['session_token'];

  // Fallback to Bearer token in case cookies are blocked inside an iframe sandbox
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer' && parts[1]) {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please path to login.' });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'User does not exist.' });
  }

  (req as any).user = user;
  next();
};

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// AUTH: Check user status
app.get('/api/auth/me', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies['session_token'];

  // Fallback to Bearer token in case cookies are blocked inside an iframe sandbox
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer' && parts[1]) {
      token = parts[1];
    }
  }

  if (!token) {
    return res.json({ user: null });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.json({ user: null });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.json({ user: null });
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      profile_color: user.profile_color,
      created_at: user.created_at
    }
  });
});

// AUTH: Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields (username, email, password) are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  if (db.getUserByEmail(email)) {
    return res.status(400).json({ error: 'This email is already registered.' });
  }

  if (db.getUserByUsername(username)) {
    return res.status(400).json({ error: 'This username is already taken.' });
  }

  const passwordHash = db.hashPassword(password);
  const newUser = db.createUser(username, email, passwordHash);

  // Auto-login
  const token = createToken(newUser.id);
  res.setHeader(
    'Set-Cookie',
    `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );

  return res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      profile_color: newUser.profile_color
    }
  });
});

// AUTH: Login
app.post('/api/auth/login', (req, res) => {
  const { identity, password } = req.body; // identity can be email or username

  if (!identity || !password) {
    return res.status(400).json({ error: 'Credentials and password required.' });
  }

  // Search user
  const user = db.getUserByEmail(identity) || db.getUserByUsername(identity);
  if (!user) {
    return res.status(401).json({ error: 'Incorrect credentials or password.' });
  }

  // Match password_hash
  const incomingHash = db.hashPassword(password);
  if (user.password_hash !== incomingHash) {
    return res.status(401).json({ error: 'Incorrect credentials or password.' });
  }

  const token = createToken(user.id);
  res.setHeader(
    'Set-Cookie',
    `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      profile_color: user.profile_color
    }
  });
});

// AUTH: Logout
app.post('/api/auth/logout', (req, res) => {
  res.setHeader(
    'Set-Cookie',
    'session_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'
  );
  return res.json({ success: true });
});

// UPDATE PROFILE
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { username, password, profile_color } = req.body;

  const updates: any = {};
  if (username) {
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    const existing = db.getUserByUsername(username);
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ error: 'Username already taken.' });
    }
    updates.username = username;
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    updates.password_hash = db.hashPassword(password);
  }

  if (profile_color) {
    updates.profile_color = profile_color;
  }

  const updatedUser = db.updateUser(user.id, updates);
  if (!updatedUser) {
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }

  return res.json({
    success: true,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      profile_color: updatedUser.profile_color
    }
  });
});

// TASKS: CRUD
app.get('/api/tasks', requireAuth, (req, res) => {
  const user = (req as any).user;
  const rawTasks = db.getTasks(user.id);

  // Implement filters
  let filtered = [...rawTasks];
  const { q, category, priority, completed, due } = req.query;

  if (q) {
    const query = (q as string).toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    );
  }

  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }

  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }

  if (completed) {
    const isCompleted = completed === 'true';
    filtered = filtered.filter(t => t.completed === isCompleted);
  }

  if (due) {
    const today = new Date().toISOString().split('T')[0];
    if (due === 'today') {
      filtered = filtered.filter(t => t.due_date && t.due_date.startsWith(today));
    } else if (due === 'overdue') {
      filtered = filtered.filter(t => !t.completed && t.due_date && t.due_date < today);
    } else if (due === 'upcoming') {
      filtered = filtered.filter(t => t.due_date && t.due_date > today);
    }
  }

  return res.json(filtered);
});

// TASK: Create
app.post('/api/tasks', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { title, description, priority, category, due_date } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  const priorityVal = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
  const categoryVal = category ? category.trim() : 'General';

  const newTask = db.createTask(user.id, {
    title: title.trim(),
    description: description ? description.trim() : '',
    priority: priorityVal,
    category: categoryVal,
    completed: false,
    due_date: due_date || ''
  });

  return res.status(210).json(newTask);
});

// TASK: Update
app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const taskId = req.params.id;

  const existing = db.getTaskById(taskId);
  if (!existing || existing.user_id !== user.id) {
    return res.status(404).json({ error: 'Task not found or permission denied.' });
  }

  const { title, description, priority, category, completed, due_date } = req.body;

  const updates: any = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) updates.priority = priority;
  if (category !== undefined) updates.category = category.trim() || 'General';
  if (completed !== undefined) updates.completed = !!completed;
  if (due_date !== undefined) updates.due_date = due_date;

  const updated = db.updateTask(taskId, updates);
  return res.json(updated);
});

// TASK: Reorder Drag & Drop list
app.post('/api/tasks/reorder', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'An array of task IDs is required.' });
  }

  db.reorderTasks(user.id, ids);
  return res.json({ success: true, message: 'Ordering successfully updated.' });
});

// TASK: Delete
app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const taskId = req.params.id;

  const existing = db.getTaskById(taskId);
  if (!existing || existing.user_id !== user.id) {
    return res.status(404).json({ error: 'Task not found or access denied.' });
  }

  db.deleteTask(taskId);
  return res.json({ success: true, message: 'Task deleted.' });
});

// STATISTICS / ANALYTICS
app.get('/api/analytics', requireAuth, (req, res) => {
  const user = (req as any).user;
  const stats = db.getAnalytics(user.id);
  return res.json(stats);
});

// REMINDERS / SIMULATED EMAIL ALERTS
app.get('/api/reminders', requireAuth, (req, res) => {
  const user = (req as any).user;
  const reminders = db.getReminders(user.id);
  return res.json(reminders);
});

// EXPORT TO CSV
app.get('/api/tasks/export', requireAuth, (req, res) => {
  const user = (req as any).user;
  const csvData = db.exportTasksToCSV(user.id);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=todo_list_tasks_${user.username}.csv`);
  return res.send(csvData);
});

// AI CHAT PROXY ENDPOINT
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  // Retrieve user's tasks to pass as context automatically
  const userTasks = db.getTasks(user.id);
  const tasksContext = userTasks.map(t => ({
    title: t.title,
    description: t.description || 'No description provided',
    priority: t.priority,
    category: t.category || 'General',
    completed: t.completed ? 'Completed' : 'Pending',
    dueDate: t.due_date || 'No deadline'
  }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(400).json({ 
      error: "Gemini API key is not configured. Please add your GEMINI_API_KEY inside the Settings > Secrets configuration panel to wake up your real AI productivity coach!" 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `You are "TaskFlowr AI Assist", a premium, friendly, highly competent productivity assistant and workflow coach embedded within the TaskFlowr task management dashboard. 
Your persona is incredibly supportive, encouraging, SaaS-native, and highly structured (use scannable bullet points, bold text accent styling, and brief action lists).

The user's username is "${user.username}".
The user's current task list:
${JSON.stringify(tasksContext, null, 2)}

Instructions:
1. Always give extremely practical, action-oriented, personalized advice using their actual current tasks context.
2. Formulate your response in clean Markdown. Break answers down with bullet points and bolding.
3. If they ask you to write checklists or suggest subtasks, construct them as simple, copyable checklists.
4. Keep answers relatively concise (< 180 words) to ensure they look stunning inside a dashboard widget.
5. If they have no tasks yet, guide them to create tasks to unlock scheduling and metrics insights.`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const response = await chat.sendMessage({ message: message.trim() });
    
    return res.json({ 
      success: true, 
      text: response.text 
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred while connecting to Gemini AI. Check your API key." 
    });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serves static files from dist
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Error starting final development server:', err);
});
