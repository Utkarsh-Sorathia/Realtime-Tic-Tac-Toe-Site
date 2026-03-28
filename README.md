# 🎮 Real-Time Tic Tac Toe Elite

![Tic Tac Toe Elite Hero Preview](./Frontend/public/og-image.png)

A high-performance, production-grade multiplayer Tic Tac Toe platform built for lightning-fast synchronization, persistent state management, and a premium, immersive gaming experience.

---

## 🚀 Key Features

-   **⚡ Real-Time Battle Grid**: Instantaneous move synchronization across all global players powered by **Pusher Channels**.
-   **🤖 Minimax Cyber-Engine**: Integrated a high-fidelity offline mode featuring a recursive Minimax AI for unbeatable practice sessions.
-   **🍃 Persistence Layer**: Comprehensive match history, real-time board states, and session-based scoring stored in **MongoDB**.
-   **🧹 Self-Healing Infrastructure**: Automated **24-hour TTL (Time To Live)** indexing to purge inactive game clusters and optimize database performance.
-   **🔗 Advanced Invite Matrix**: One-click direct link invite system for instant private room access without manual code entry.
-   **📱 PWA / Mobile Native**: Fully functional Progressive Web App with zero-scrollbar immersive viewports for a native mobile and desktop feel.
-   **🎭 Secure Identity**: Encrypted player identity persistence in local storage with real-time heartbeat synchronization.

---

## 🛠️ Architecture & Tech Stack

-   **Frontend**: React 18, Vite, **Tailwind CSS**, Framer Motion (Hardware-Accelerated), Lucide-React.
-   **Backend**: Node.js, Express, **TypeScript (Strict Type Safety)**, Mongoose ODM.
-   **Database**: MongoDB (Production Instances).
-   **Real-time Layer**: Pusher (Pub/Sub Presence Channels).
-   **SEO & Metadata**: Integrated **JSON-LD Structured Data**, OpenGraph protocols, and hardware-accelerated background orbs.

---

## ⚙️ Development Setup

### 1. Prerequisites
Ensure you have a **MongoDB Cluster URI** and **Pusher API** credentials active.

### 2. Backend Orchestration
```bash
cd Backend
npm install
# Configure .env with MONGODB_URI and PUSHER credentials
npm run dev
```

### 3. Frontend Execution
```bash
cd Frontend
npm install
# Configure .env with VITE_API_URL and VITE_PUSHER_KEY
npm run dev
```

---

## 📦 Production Deployment

The platform is architected for seamless deployment on **Vercel**:
- **Backend Layer**: Includes custom `vercel.json` for serverless route handling.
- **Frontend Layer**: Optimized build manifests for edge-network distribution.

---

## 👨‍💻 Developed By

**Utkarsh Sorathia**
-   **Portfolio**: [utkarshsorathia.in](https://utkarshsorathia.in)
-   **GitHub**: [@Utkarsh-Sorathia](https://github.com/Utkarsh-Sorathia)

---

## 🛡️ License
Distributed under the **MIT License**. See `LICENSE` for more information.
