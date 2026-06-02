# Cybet - Cyberpunk Dice Casino Simulator 🎲⚡

A high-performance, real-time local multiplayer casino simulator built for friend groups to enjoy dynamic betting on dice rolls. Features a sleek cyberpunk dark aesthetic, high security, and real-time synchronization.

## 🚀 Project Overview

Cybet allows users to register, manage virtual wallets, and place bets on simulated 6-sided dice rolls in real-time. An executive admin manages finances, user status, and withdrawal approvals, providing a seamless "real-world" software architecture for dynamic environments.

### 🛠️ Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS (Cyber Dark Theme), Socket.io-client, Lottie Animations
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Deployment:** Vercel (Frontend & Backend Optimized)

---

## 🏗️ Architecture & Features Implemented (Milestone 1 & 2)

### 1. Robust Server Environment & Database Core
- Multi-tier folder structure designed for industry-standard scalability (`config`, `models`, `controllers`, `routes`, `middleware`).
- Live secure connection to MongoDB Atlas with customized database routing (`/Cybet`).
- Environment variable encapsulation (`.env`) safeguarding secrets, ports, and connection URIs.

### 2. High-Performance Database Models
- **User Model:** Stores credentials, dynamic balance tracking, role isolation (`user` vs `admin`), account freezing states (`isFrozen`), and tracking metrics.
- **Transaction Model:** Handles chronological ledger for deposits, wins, losses, and precise double-phased withdrawal operations (`withdrawal_request` & `withdrawal_approved`).
- **GameRound Model:** Manages live server-side game states. Features an engineered **7-Day Time-To-Live (TTL) Automatic Index** to self-purge historic game logs while preserving vital financial records.

---

## 🛠️ Step-by-Step GitHub Push Instructions

Open your terminal in **Antigravity IDE** and ensure you are at the root directory (`Cybet`), **NOT** inside the `backend` folder. If you are inside `backend`, type `cd ..` to go back.

Run the following commands one by one to initialize Git, ignore heavy folders, write the configuration, and push securely to your repository:

```bash
# 1. Initialize git repository
git init

# 2. Prevent pushing heavy node_modules to GitHub (Crucial Step!)
echo "node_modules/" >> .gitignore
echo "backend/node_modules/" >> .gitignore
echo ".env" >> .gitignore

# 3. Stage all architectural files and commit
git add .
git commit -m "feat: Initialize project architecture, database connections, and core models"

# 4. Set branch and configure remote origin
git branch -M main
git remote add origin [https://github.com/madu1995/cybet.git](https://github.com/madu1995/cybet.git)

# 5. Push code safely to your main branch
git push -u origin main