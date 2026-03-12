# 🎲 Curio — Multiplayer Card Game

A real-time online "get to know you" card game built with Node.js + Socket.io.

---

## How to Deploy for FREE (pick one)

---

### Option A: Railway (Recommended — easiest, ~3 minutes)

1. Go to **https://railway.app** and sign up with GitHub (free)
2. Click **"New Project" → "Deploy from GitHub repo"**
3. Upload this folder to a new GitHub repo first:
   - Go to https://github.com/new
   - Create a repo called `curio-game`
   - Upload all files in this folder
4. Back in Railway, select your `curio-game` repo
5. Railway auto-detects Node.js and runs `npm start`
6. Click **"Generate Domain"** — you get a free URL like `curio-game.up.railway.app`
7. Share that link with your friend — they open it and enter your room code!

**Free tier:** 500 hours/month (plenty for games)

---

### Option B: Render (Also free, slightly slower cold starts)

1. Go to **https://render.com** and sign up
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo (same steps as above to upload)
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Click **"Create Web Service"**
6. Wait ~2 minutes for deploy — you get a URL like `curio-game.onrender.com`

**Note:** Free Render apps "sleep" after 15 mins of inactivity. First load may take 30 seconds to wake up.

---

### Option C: Run locally (for same-network play)

```bash
npm install
node server.js
```

Open `http://localhost:3000` — share your local IP (e.g. `http://192.168.1.x:3000`) with someone on the same WiFi.

---

## How the Game Works

1. **Player 1** opens the URL, enters their name, clicks **"Create a Room"**
2. A 5-character room code appears (e.g. `AB3KX`)
3. **Player 2** opens the same URL, enters their name + the code, clicks **"Join Room"**
4. Game starts automatically!

### Rules
- Each player holds **5 cards** at a time (refilled automatically from the deck)
- The active player has **15 seconds** to pick and play a card for their opponent
- The opponent has **60 seconds** to answer
- Each player has **3 passes** (❤️) — use them wisely
- Cards are **completely private** — the server only sends each player their own hand
- First to answer the most questions wins!

---

## File Structure

```
curio-online/
├── server.js          # Game server (Node.js + Socket.io)
├── package.json       # Dependencies
├── public/
│   └── index.html     # Frontend (served statically)
└── README.md          # This file
```
