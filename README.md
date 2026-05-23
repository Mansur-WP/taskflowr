# 🪐 TaskFlowr • Premium Personal Progress Workspace

Welcome to **TaskFlowr**, a secure, highly polished, and visually stunning Full-Stack Personal Productivity Hub. Built with a bespoke dark cosmic theme, TaskFlowr streamlines your daily workspace with custom task queues, drag-and-drop ordering, calendars, bento analytics dashboards, focus timers, and bulletproof user security safeguards.

---

## 🎨 Design Conceptions & Visual Identity

TaskFlowr is crafted with a meticulous, modern eye for aesthetics, typography, and response-driven interactive designs:
- **Custom App Logo**: An elegant vector signature logo configured in `AppLogo.tsx` — a modern, ribbon-folded "F" blending royal blue, cyan, indigo, and violet gradients overlaid with a sharp 3D shadow-dropped checkmark.
- **Micro-Favicon Support**: A responsive SVG favicon rendered in standard browser chrome tabs matching the deep indigo and cyan ribbon aesthetic.
- **Bespoke Deep Purple Canvas**: Dark frames crafted on top of heavy cosmic indigo, violet, and obsidian midnight backgrounds (`#09051d`, `#08051a`) accented by rich neon boundaries.
- **Responsive Workspace Navigation**: A heavy, dynamic sidebar collapsing beautifully into an app bar header custom-fit for mobile devices.
- **Fluid Micro-Animations**: Smooth scale transforms, hover spring offsets, and layout state shifts programmed via `motion/react`.

---

## 🚀 Key Feature Upgrades

### 🔒 Gmail Guardian Safeguards & Verification
- **Anti-Hijacking Auth Flow**: New user registrations require requesting and verifying a simulated 6-digit OTP verification code dispatched instantly to your registered Gmail address.
- **Secured Credential Reset**: Modifying your security credentials inside preferences demands real-time ownership validation via a fresh 6-digit Gmail OTP safeguard to prevent password tampering.

### 👤 Verified Personal Workspace ("My Data Only")
- **True Account Bounds**: Every task, statistic, project milestone, and timeline record is rigorously sandboxed to your credentials.
- **Personalized Assignments**: Task delegations are exclusively bound to you (`YOUR_NAME (You)`), cleaning out any secondary pseudo-accounts or random dummy test-user entries.

### 📐 High-Performance Task Engine
- **HTML5 Drag & Drop Arranger**: Reorder task positions cleanly inside status lanes; card layouts capture layout shifts and serialize position variables natively to local files.
- **Interactive Checklists**: Inline sub-task progress indicator columns representing real-time percentage progress bars matching the glowing primary gradients.
- **Dynamic Due Date Tracker**: Overdue notices warning of expired deadlines dynamically.

### 📅 Unified Productivity Toolkit
- **Monthly Scheduler**: High-fidelity month view showing scheduled item calendars. Clicking any day opens up side drawer task overlays.
- **Bento Analytics Hub**: Download raw CSV spreadsheet records alongside sleek circular custom metrics gauges.
- **Focus Work Timer**: Elegant countdown interval utility built to power deep focus sprints.

---

## 🏗️ Technical Architecture

TaskFlowr operates as an absolute **Full-Stack Express + Node.js + React + TS** application, serving dynamic resources on **Port 3000**:

```
taskflowr/
├── server.ts                 # Express core framework (API controllers, sessions, static asset routes)
├── server/
│   └── db.ts                 # Logically isolated database handlers & credentials encryption
├── data/
│   └── db.json               # Relational local persistent repository
├── src/
│   ├── App.tsx               # Primary react workspace state system
│   ├── types.ts              # Absolute TypeScript interfaces & enums
│   ├── index.css             # Tailwind styling base with custom typography variables
│   └── components/
│       ├── AppLogo.tsx       # Bespoke 3D folded F brand logo vector
│       ├── AuthView.tsx      # Secure registry workspace with Gmail OTP check
│       ├── Sidebar.tsx       # Adaptive lateral navigation deck
│       ├── DashboardView.tsx # Bento analytics outline
│       ├── TaskListView.tsx  # Interactive lists with full drag-and-drop controller
│       ├── CalendarView.tsx  # Event tracking calendars
│       ├── FocusTimerView.tsx# Interval work timer
│       └── ProfileView.tsx   # Verified preferences & security settings drawer
```

---

## 💻 Quick Installation & Running Locally

Ensure Node.js is active on your device, then execute:

1. **Install Base Modules**:
   ```bash
   npm install
   ```

2. **Boot Development Server**:
   ```bash
   npm run dev
   ```
   *Your server will initiate on host `0.0.0.0:3000` automatically.*

3. **Production Compilation**:
   ```bash
   npm run build
   npm run start
   ```
