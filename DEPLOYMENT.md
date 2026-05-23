# 🚀 TaskFlowr: Simple Beginner-Friendly Deployment Guide

If you are new to programming or web development, "deploying" simply means taking your web app off your computer (or the playground environment) and putting it on a real, live web server so anyone in the world can visit it using a custom web link!

This guide explains **exactly how TaskFlowr works** under the hood and walks you through how to deploy it step-by-step, explaining every concept simply.

---

## 💡 Concept Checklist (What you need to understand first)

Before launching, it helps to understand how TaskFlowr works. It is a **Full-Stack** application, meaning it has three main parts:

### 1. The Frontend (The Face 🎨)
*   **What it is**: The actual visual dashboard, cards, calendar, buttons, and sliding panels you click on.
*   **How it works**: It is built using **React** and styled with **Tailwind CSS**. 
*   **In Production**: A tool named Vite pre-packages all these files into simple, super-fast visual files (HTML, CSS, JS) inside a folder named `/dist`.

### 2. The Backend (The Brain 🧠)
*   **What it is**: An **Express.js API server** that handles logging users in, checking Gmail verification security codes, saving tasks, and streaming analytics files.
*   **How it works**: It runs continuously in the background on **Port 3000** listening for requests from your browser.

### 3. The Database (The Memory 💾)
*   **What it is**: A clean text file inside `/data/db.json` that stores users, encrypted passwords, and your tasks.
*   **The "Cloud Catch"**: When you host an app in the cloud (like on Render or Cloud Run), the cloud server puts your app in a temporary container. If the app restarts, any fresh changes saved to file databases (`db.json`) are erased! 
*   **How to solve it simply**: In this guide, we show you how to attach a **Persistent Cloud Storage Disk** (takes 1 click) to act like an external USB flash drive that keeps your data safe forever.

---

## 🛠️ Step-by-Step: The Easiest Deployment (Render.com)

**Render** is the absolute friendliest platform for beginners because you can host your backend, frontend, and your file database together in one place for free.

### Step 1: Push Your Code to Github
1. Make a free account at [GitHub](https://github.com).
2. Create a new "Repository" (think of it as a cloud folder for your code).
3. Upload your TaskFlowr files to this repository.

### Step 2: Set Up Your Account on Render
1. Go to [Render](https://render.com) and sign up with your GitHub account.
2. Click the blue **New +** button in the top right corner and select **Web Service**.
3. Connect the GitHub repository you just created.

### Step 3: Match the Build Settings
Once you select your repository, Render will ask you how to build your app. Fill out these boxes:
*   **Name**: `taskflowr`
*   **Language**: `Docker` *(Docker automatically looks at our pre-packaged script instructions to set everything up perfectly!)*
*   **Instance Type**: `Free`

### Step 4: Add Your Security Secret (Environment Variables)
Keep your logins secure by adding a unique secret key. 
1. In the Render creation screen, scroll down and find **Environment Variables**.
2. Click **Add Variable** and enter:
   *   **Key**: `JWT_SECRET`
   *   **Value**: *[Type in any long, random sentence of letters and numbers]* (This acts as a special signature key to prove users are securely logged in).
   *   **Key**: `NODE_ENV`
   *   **Value**: `production`

### Step 5: Mount Your Persistent Memory (Don't skip this!)
To stop your database from resetting whenever Render automatically updates:
1. On the same Render configuration screen, scroll down to the **Disks** section.
2. Click **Add Disk** and input:
   *   **Name**: `taskflowr-storage`
   *   **Mount Path**: `/app/data`
   *   **Size**: `1 GiB` *(This is completely free and holds plenty of tasks!)*
3. Click **Create Web Service** at the bottom of the page!

That is it! Render will process the installation for 2–3 minutes and then provide you with a live shareable URL (like `https://taskflowr.onrender.com`).

---

## ❓ Frequently Asked Questions (FAQ)

#### Q: Can I host the app on Vercel or Netlify?
**A**: Vercel and Netlify are beautiful platforms, but they are built mainly for static frontends. Because TaskFlowr has a live Node.js background server with an active file-database (`db.json`), standard Vercel setups cannot run it alone. We recommend Render because it hosts full-stack apps effortlessly.

#### Q: How does the "Gmail Verification Code" feature work when deployed?
**A**: To protect your privacy, we built a security loop for registrations and password changes. In your browser console or server terminal logs (`docker output` or `Render log stream`), you will instantly see the simulated 6-digit confirmation code print out for you. Just grab that code, paste it in, and your new account or secure password update activates!

#### Q: What if I want to upgrade to a real managed database later?
**A**: It is easy! When your task list grows to hundreds of users, you can buy a managed database (like PostgreSQL or Firebase) and rewrite the helper functions inside `/server/db.ts` to replace the local JSON files. The entire rest of the layout and user experience will stay exactly the same.
