# 🪐 TaskFlow - Modern Full-Stack To-Do Workspace

Welcome to **TaskFlow**, a secure, feature-rich, and visually stunning Full-Stack To-Do with drag-and-drop sequencing, monthly calendars, dynamic bento analytics, and data spreadsheets exporter. 

Designed for high-performance and absolute security, this workspace represents an ultra-responsive client-server architecture.

---

## 🎨 Design Conceptions & Visual Integrity

TaskFlow is crafted with a highly polished aesthetic pairing, utilizing generous negative space, crisp responsive dimensions, and interactive hover details:
- **Responsive Sidebar Navigation**: Collapses automatically on mobile devices into an overlay side drawer.
- **Micro-Animations**: Staggered enter transitions and fluid drag feedback powered by `motion/react`.
- **Cosmic Dark Mode Alt-D**: Standard light and dark canvas colors, toggleable with a mouse click or hotkey (`ALT + D`).
- **Real-Time Stat Counters**: Real-time calculated goals trackers (Total, Completed, Pending tasks) accompanied by dynamic circular SVG progress gauges.
- **Active Alerts Simulation**: Active System Notifications logs highlighting imminent task deadlines inside index margins.

---

## 🚀 Feature Highlights

### 🔒 Secure User Authentication
- Dual register and login screens equipped with password validation checks.
- Zero raw cookies storage—sessions are verified server-side with cryptographic HMAC signatures.
- Anti-CSRF protection guarding sensitive task-alteration endpoints.

### 📐 Robust To-Do Controller
- **Drag & Drop Arranger**: Rearrange tasks natively with standard HTML5 drag actions (`onDragStart`, `onDrop`), persisting order seamlessly.
- **Advanced Querying**: Search titles and descriptions dynamically, combined with priority, tag (category), and status selectors.
- **Inline Editing Modal**: Refine priority, categories, descriptions, or deadlines inline.
- **Due Date Audit**: Colorful tag alerts highlighting overdue items.
- **Pagination**: Scroll past long task listing rows smoothly.

### 📅 Visual Calendar Grid
- Monthly date cells displaying colored dots for scheduled tasks.
- Selecting any card day fires up a quick slide-out lists drawer to resolve tasks.

### 📊 bento Analytics
- Direct **Export to CSV** streaming attachment downloads.
- Priority pipelines horizontal tracking bars.
- Dynamic task completion health gauges.

---

## 🏗️ Technical Architecture

This application operates as a **Full-Stack Express + Node.js + React.js + TypeScript** powerhouse, running behind a reverse-proxy layer on **Port 3000**:

```
project/
├── server.ts                 # Express Core Server (managing API routes, cookie tokens, serving assets)
├── server/
│   └── db.ts                 # Database Engine (relational tables mock written to instance logs)
├── data/
│   └── db.json               # Relational SQLite-equivalent local file-lock database
├── src/
│   ├── App.tsx               # Workspace Coordinate states hub
│   ├── types.ts              # Global Type Definitions
│   ├── index.css             # Tailwind v4 configuration and typographic imports
│   └── components/
│       ├── AuthView.tsx      # Registration & Login Controllers
│       ├── Sidebar.tsx       # Navigation Drawer and Dark Mode Toggle
│       ├── DashboardView.tsx # Bento Overview & System Notification reminders
│       ├── TaskListView.tsx  # Task Cards & HTML5 Drag Handler
│       ├── CalendarView.tsx  # Monthly deadliner cells mapping
│       ├── AnalyticsView.tsx # SVG statistical charts & CSV exporter trigger
│       └── ProfileView.tsx   # Preferred customization settings
```

---

## 💻 Quick Installation & Running Locally

### Node.js & React Full-Stack (Default Recommended)

1. **Install Base Modules**:
   ```bash
   npm install
   ```

2. **Boot Development Environment**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with TaskFlow.

3. **Production Compliant Bundling**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🐍 Auxiliary Python Flask Target (For Portable Deployment)

If you prefer building in Python Flask as secondary deployment target (under Render, Railway, or PythonAnywhere):

### 1. Requirements list (`requirements.txt`)
Create a python virtual environment, install requirements listed under `/requirements.txt`:
```bash
pip install -r requirements.txt
```

### 2. Flask MVC Blueprint equivalent schemas:
The server-side modules are fully identical to the JSON engine schemas declared under `server/db.ts`:
```python
# app/models.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    profile_color = db.Column(db.String(7), default="#3b82f6")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Task(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(10), default="medium") # low, medium, high
    category = db.Column(db.String(50), default="General")
    completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.String(10), nullable=True) # YYYY-MM-DD
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    position = db.Column(db.Integer, default=1000)
```

### 3. Running Flask Server:
```bash
python run.py
```
*(The Flask Blueprint structure mimics our controller pathways under `/server.ts` directly, binding REST APIs to SQLAlchemy).*
