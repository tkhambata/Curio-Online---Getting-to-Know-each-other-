const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

function resolvePublicDir() {
  const candidates = [];
  if (process.env.PUBLIC_DIR) candidates.push(path.resolve(process.env.PUBLIC_DIR));
  candidates.push(
    path.join(__dirname, 'public'),
    path.join(__dirname, 'curio-online', 'public')
  );
  for (const dir of candidates) {
    try { if (fs.existsSync(path.join(dir, 'index.html'))) return dir; } catch (_) {}
  }
  return candidates[0];
}

const PUBLIC_DIR = resolvePublicDir();
app.use(express.static(PUBLIC_DIR));
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

// ── 50 Questions: 17 Funny · 17 Get To Know · 16 Flirty ─────────────────────
const BASE_QUESTIONS = [
  // 😂 FUNNY (17)
  { cat:'😂 Funny', q:"What's the most ridiculous thing you've ever done to impress someone?" },
  { cat:'😂 Funny', q:"If your life had a laugh track, when would it go off most today?" },
  { cat:'😂 Funny', q:"What's the weirdest food combination you genuinely enjoy?" },
  { cat:'😂 Funny', q:"If you were a villain, what would your evil plan be?" },
  { cat:'😂 Funny', q:"What's a completely irrational fear you have that you can't explain?" },
  { cat:'😂 Funny', q:"What's the most dramatic thing you've done over something completely tiny?" },
  { cat:'😂 Funny', q:"If animals could talk, which one would be the most unbearable?" },
  { cat:'😂 Funny', q:"What's the worst advice you were given and actually followed?" },
  { cat:'😂 Funny', q:"What's your go-to dance move — and does it have a name?" },
  { cat:'😂 Funny', q:"If you were a pizza topping, which one and why?" },
  { cat:'😂 Funny', q:"What's the most chaotic thing you did as a kid that your parents never found out?" },
  { cat:'😂 Funny', q:"What reality show would you either dominate or completely embarrass yourself on?" },
  { cat:'😂 Funny', q:"What's the most useless talent you have?" },
  { cat:'😂 Funny', q:"If you could only eat one cuisine for the rest of your life but it had to be from a gas station, what would you choose?" },
  { cat:'😂 Funny', q:"What's a hill you will absolutely die on, even though you know it's ridiculous?" },
  { cat:'😂 Funny', q:"What's something you did as a kid that you thought was totally normal but was actually very weird?" },
  { cat:'😂 Funny', q:"If you had a theme song that played every time you walked into a room, what would it be?" },

  // 🌟 GET TO KNOW YOU (17)
  { cat:'🌟 About You', q:"What's something you believed as a child that turned out to be completely wrong?" },
  { cat:'🌟 About You', q:"What does your perfect Sunday look like from start to finish?" },
  { cat:'🌟 About You', q:"What's something you've changed your mind about in the last year?" },
  { cat:'🌟 About You', q:"What do you think about on long drives or walks alone?" },
  { cat:'🌟 About You', q:"What's a value you hold that most people around you don't share?" },
  { cat:'🌟 About You', q:"If you could go back and give your 16-year-old self one piece of advice, what would it be?" },
  { cat:'🌟 About You', q:"What's the most spontaneous thing you've ever done — and did it pay off?" },
  { cat:'🌟 About You', q:"What would your friends say is your most annoying habit?" },
  { cat:'🌟 About You', q:"When do you feel most like the truest version of yourself?" },
  { cat:'🌟 About You', q:"What's a failure that ended up teaching you something you're grateful for?" },
  { cat:'🌟 About You', q:"What's something you want to get better at — and what's stopping you?" },
  { cat:'🌟 About You', q:"What's a skill or talent you're secretly proud of?" },
  { cat:'🌟 About You', q:"If you could have dinner with anyone from history, who and why?" },
  { cat:'🌟 About You', q:"What does success genuinely mean to you — not what you think it should mean?" },
  { cat:'🌟 About You', q:"What's something about the world that genuinely excites you right now?" },
  { cat:'🌟 About You', q:"What's a book, film or song that changed the way you see something?" },
  { cat:'🌟 About You', q:"What's the best piece of advice someone has ever given you?" },

  // 😏 FLIRTY (16)
  { cat:'😏 Flirty', q:"What's the first thing you notice about someone you're attracted to?" },
  { cat:'😏 Flirty', q:"What's the most attractive quality someone can have that has nothing to do with looks?" },
  { cat:'😏 Flirty', q:"What's your idea of an absolutely perfect first date?" },
  { cat:'😏 Flirty', q:"What's something someone could do that would instantly win you over?" },
  { cat:'😏 Flirty', q:"What's the most romantic thing anyone has ever done for you?" },
  { cat:'😏 Flirty', q:"What does it feel like when you really click with someone?" },
  { cat:'😏 Flirty', q:"What's a green flag you always look out for early on with someone?" },
  { cat:'😏 Flirty', q:"What's your love language — and do you think people actually get it right with you?" },
  { cat:'😏 Flirty', q:"What's something small that someone does that you find unexpectedly attractive?" },
  { cat:'😏 Flirty', q:"What does a genuinely great conversation feel like to you?" },
  { cat:'😏 Flirty', q:"If you could only describe your ideal partner in three words, what would they be?" },
  { cat:'😏 Flirty', q:"What's the difference between someone you like and someone you can't stop thinking about?" },
  { cat:'😏 Flirty', q:"What's something you find easy to talk about only when you really trust someone?" },
  { cat:'😏 Flirty', q:"What's the most memorable compliment you've ever received?" },
  { cat:'😏 Flirty', q:"What's something you've never been asked on a date but wish someone would ask you?" },
  { cat:'😏 Flirty', q:"What's something that makes you feel genuinely seen by another person?" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:5}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

const rooms = {};

// ── Build a private deck of 50 for one player ─────────────────────────────────
// Merges base questions with any custom ones, shuffles, tags with unique ids.
function buildPlayerDeck(customQ, playerSuffix) {
  let q = [...BASE_QUESTIONS];
  customQ.forEach(text => { if (text.trim()) q.push({ cat:'⭐ Custom', q: text.trim() }); });
  return shuffle(q).slice(0, 50).map((card, i) => ({ ...card, id: `${playerSuffix}-${i}` }));
}

function createRoom(code, customQ = []) {
  rooms[code] = {
    code,
    players: [],
    phase: 'waiting',
    currentPlayer: 0,
    respondingPlayer: 1,
    playedCard: null,
    pTimerVal: 15,
    aTimerVal: 60,
    pTimerInterval: null,
    aTimerInterval: null,
  };
  return rooms[code];
}

// Deal cards from a player's own personal deck into their hand.
// Stops when hand reaches targetSize OR personal deck is empty.
function dealToHand(player, targetSize = 5) {
  while (player.hand.length < targetSize && player.deck.length > 0) {
    player.hand.push(player.deck.shift());
  }
}

function broadcastState(room) {
  room.players.forEach((p, idx) => {
    const opp = room.players[1 - idx];
    io.to(p.id).emit('state', {
      phase: room.phase,
      myIndex: idx,
      currentPlayer: room.currentPlayer,
      respondingPlayer: room.respondingPlayer,
      myName: p.name,
      opponentName: opp ? opp.name : '...',
      myHand: p.hand,
      myDeckCount: p.deck.length,        // cards left in THIS player's personal deck
      needsDraw: p.needsDraw || false,   // true when hand==1 and deck has cards
      myAnswered: p.answered,
      opponentAnswered: opp ? opp.answered : 0,
      myPasses: p.passes,
      opponentPasses: opp ? opp.passes : 3,
      playedCard: room.playedCard,
      pTimerVal: room.pTimerVal,
      aTimerVal: room.aTimerVal,
    });
  });
}

function startPlayTimer(room) {
  clearInterval(room.pTimerInterval);
  room.pTimerVal = 15;
  broadcastState(room);
  room.pTimerInterval = setInterval(() => {
    room.pTimerVal--;
    broadcastState(room);
    if (room.pTimerVal <= 0) {
      clearInterval(room.pTimerInterval);
      const cp = room.players[room.currentPlayer];
      if (cp && cp.hand.length > 0) {
        // Auto-play their first card
        executePlayCard(room, 0);
      } else {
        endGame(room);
      }
    }
  }, 1000);
}

function startAnswerTimer(room) {
  clearInterval(room.aTimerInterval);
  room.aTimerVal = 60;
  broadcastState(room);
  room.aTimerInterval = setInterval(() => {
    room.aTimerVal--;
    broadcastState(room);
    if (room.aTimerVal <= 0) {
      clearInterval(room.aTimerInterval);
      room.players.forEach(p => io.to(p.id).emit('toast', "⏰ Time's up!"));
      nextTurn(room);
    }
  }, 1000);
}

// Core card-play logic
function executePlayCard(room, cardIdx) {
  const cp = room.players[room.currentPlayer];
  const card = cp.hand.splice(cardIdx, 1)[0];
  room.playedCard = card;
  room.phase = 'answer';

  // After playing, check if hand is now down to 1 AND deck still has cards
  // → flag needsDraw so the client shows the "Draw 4" prompt next pick phase
  cp.needsDraw = cp.hand.length === 1 && cp.deck.length > 0;

  broadcastState(room);
  startAnswerTimer(room);
}

function nextTurn(room) {
  const tmp = room.currentPlayer;
  room.currentPlayer = room.respondingPlayer;
  room.respondingPlayer = tmp;
  room.phase = 'pick';
  room.playedCard = null;

  // Check game-over: both players have exhausted hand AND deck
  const p0 = room.players[0], p1 = room.players[1];
  if (p0.hand.length === 0 && p0.deck.length === 0 &&
      p1.hand.length === 0 && p1.deck.length === 0) {
    endGame(room); return;
  }

  broadcastState(room);
  startPlayTimer(room);
}

function endGame(room) {
  clearInterval(room.pTimerInterval);
  clearInterval(room.aTimerInterval);
  room.phase = 'end';
  broadcastState(room);
}

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  socket.on('create_room', ({ name, customQ }) => {
    let code;
    do { code = makeCode(); } while (rooms[code]);
    createRoom(code, customQ || []);
    const room = rooms[code];
    const playerDeck = buildPlayerDeck(customQ || [], 'p0');
    const player = { id: socket.id, name: name || 'Player 1', deck: playerDeck, hand: [], answered: 0, passes: 3, needsDraw: false };
    dealToHand(player, 5);
    room.players.push(player);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerIdx = 0;
    socket.emit('room_created', { code });
    socket.emit('waiting_for_opponent');
  });

  socket.on('join_room', ({ code, name, customQ }) => {
    const room = rooms[code.toUpperCase()];
    if (!room) { socket.emit('error_msg', 'Room not found. Check the code!'); return; }
    if (room.players.length >= 2) { socket.emit('error_msg', 'Room is already full!'); return; }
    if (room.phase !== 'waiting') { socket.emit('error_msg', 'Game already in progress!'); return; }

    const playerDeck = buildPlayerDeck(customQ || [], 'p1');
    const player = { id: socket.id, name: name || 'Player 2', deck: playerDeck, hand: [], answered: 0, passes: 3, needsDraw: false };
    dealToHand(player, 5);
    room.players.push(player);
    socket.join(code.toUpperCase());
    socket.data.roomCode = code.toUpperCase();
    socket.data.playerIdx = 1;

    room.phase = 'pick';
    broadcastState(room);
    startPlayTimer(room);
  });

  // Player draws 4 more cards (when they have exactly 1 left)
  socket.on('draw_cards', () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'pick') return;
    if (socket.data.playerIdx !== room.currentPlayer) return;
    const cp = room.players[room.currentPlayer];
    // Only allowed when hand is exactly 1 and needsDraw is true
    if (!cp.needsDraw || cp.hand.length !== 1) return;

    dealToHand(cp, 5); // draws up to 4 more (to reach 5 total)
    cp.needsDraw = false;
    broadcastState(room);
  });

  socket.on('play_card', ({ cardIdx }) => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'pick') return;
    if (socket.data.playerIdx !== room.currentPlayer) return;
    const cp = room.players[room.currentPlayer];
    if (cardIdx < 0 || cardIdx >= cp.hand.length) return;
    // Block playing if they need to draw first
    if (cp.needsDraw) { socket.emit('toast', 'Draw your new cards first!'); return; }

    clearInterval(room.pTimerInterval);
    executePlayCard(room, cardIdx);
  });

  socket.on('mark_answered', () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'answer') return;
    if (socket.data.playerIdx !== room.currentPlayer) return;
    clearInterval(room.aTimerInterval);
    room.players[room.respondingPlayer].answered++;
    const rName = room.players[room.respondingPlayer].name;
    room.players.forEach(p => io.to(p.id).emit('toast', `✅ ${rName} answered!`));
    nextTurn(room);
  });

  socket.on('use_pass', () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'answer') return;
    if (socket.data.playerIdx !== room.respondingPlayer) return;
    const rp = room.players[room.respondingPlayer];
    if (rp.passes <= 0) { socket.emit('toast', 'No passes left!'); return; }
    clearInterval(room.aTimerInterval);
    rp.passes--;
    room.players.forEach(p => io.to(p.id).emit('toast', `❤️ ${rp.name} passed (${rp.passes} left)`));
    nextTurn(room);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    room.players.forEach(p => { if (p.id !== socket.id) io.to(p.id).emit('opponent_left'); });
    setTimeout(() => { delete rooms[code]; }, 30000);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎲 Curio server running on port ${PORT}`));
