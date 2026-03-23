# 🎮 Real-Time Tic Tac Toe Elite

A high-performance, multiplayer Tic Tac Toe game with persistent state, real-time synchronization, and a premium user experience.

---

## 🚀 Key Features

-   **⚡ Real-Time Synchronization**: Instant move updates across all players using **Pusher Channels**.
-   **🍃 Persistent Game State**: Match history, scores, and active board states are stored in **MongoDB**.
-   **🛡️ Self-Cleaning Database**: Implemented a **24-hour TTL (Time To Live)** index to automatically purge inactive "ghost rooms," ensuring high performance.
-   **🔗 Smart Invite System**: Share a direct link to any game room. Players with a link join instantly without entering codes.
-   **📱 PWA support**: Fully installable as a Progressive Web App for a native mobile experience.
-   **🏆 Tournament Scoreboard**: Tracks Wins, Losses, and Draws per session.
-   **🎭 Unified Identity**: Custom player names are persisted in local storage and synchronized with the backend.

---

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide-React.
-   **Backend**: Node.js, Express, TypeScript, Mongoose.
-   **Database**: MongoDB.
-   **Real-time Layer**: Pusher.
-   **Deployment**: Vercel.

---

## ⚙️ Development Setup

### 1. Prerequisites
You will need a **MongoDB Connection URI** and **Pusher API credentials**.

### 2. Backend Installation
```bash
cd Backend
npm install
# Create a .env file with your MONGODB_URI and PUSHER credentials
npm run dev
```

### 3. Frontend Installation
```bash
cd Frontend
npm install
# Create a .env file with your VITE_API_URL and PUSHER keys
npm run dev
```

---

## 📦 Deployment

This project is optimized for deployment on **Vercel**. 
- The **Backend** includes a `vercel.json` configuration for seamless serverless execution.
- The **Frontend** can be deployed directly from the `Frontend` folder.

---

## 👨‍💻 Developed By

**Utkarsh Sorathia**
-   Portfolio: [utkarshsorathia.in](https://utkarshsorathia.in)
-   GitHub: [@Utkarsh-Sorathia](https://github.com/Utkarsh-Sorathia)

---
Licensed under the [MIT License](LICENSE).
