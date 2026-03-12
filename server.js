const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route so platforms like Railway
// always serve the main app HTML on "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Questions ────────────────────────────────────────────────────────────────
const BASE_QUESTIONS = [
  {cat:"🌍 Dreams",q:"If you could live anywhere for a year, where would you go and why?"},
  {cat:"🌍 Dreams",q:"What's one thing on your bucket list you haven't done yet?"},
  {cat:"🌍 Dreams",q:"If money wasn't a thing, what career would you choose?"},
  {cat:"🌍 Dreams",q:"Describe your perfect day from morning to night."},
  {cat:"🌍 Dreams",q:"What's a skill you've always wanted to master?"},
  {cat:"👨‍👩‍👧 Family",q:"What's your favourite memory with your family growing up?"},
  {cat:"👨‍👩‍👧 Family",q:"What's a tradition from your childhood you want to keep?"},
  {cat:"👨‍👩‍👧 Family",q:"What's one thing your parents taught you that you really value?"},
  {cat:"👨‍👩‍👧 Family",q:"How would your family describe you in three words?"},
  {cat:"💬 Opinions",q:"What's a hill you would die on — an opinion you'll never change?"},
  {cat:"💬 Opinions",q:"What's a popular trend you genuinely don't understand?"},
  {cat:"💬 Opinions",q:"What's something most people do that you think is overrated?"},
  {cat:"💬 Opinions",q:"What do you think is criminally underrated in life?"},
  {cat:"🎉 Fun",q:"What reality show would you either dominate or completely fail at?"},
  {cat:"🎉 Fun",q:"What's your go-to karaoke song?"},
  {cat:"🎉 Fun",q:"If you were a snack, what would you be and why?"},
  {cat:"🎉 Fun",q:"What's the most embarrassing thing that's ever happened to you in public?"},
  {cat:"🎉 Fun",q:"What's a movie you could quote from start to finish?"},
  {cat:"🎉 Fun",q:"What's the weirdest food combination you actually enjoy?"},
  {cat:"🧠 Deep",q:"What's something about yourself that took you a long time to accept?"},
  {cat:"🧠 Deep",q:"What's a failure that ended up teaching you something valuable?"},
  {cat:"🧠 Deep",q:"When do you feel most like yourself?"},
  {cat:"🧠 Deep",q:"What's the best advice you've ever received?"},
  {cat:"🧠 Deep",q:"What does success mean to you personally?"},
  {cat:"🔮 Future",q:"Where do you see yourself in five years?"},
  {cat:"🔮 Future",q:"What does your ideal home life look like?"},
  {cat:"🔮 Future",q:"Is there a skill you want to master before you turn 40?"},
  {cat:"🧒 Childhood",q:"What did you want to be when you grew up?"},
  {cat:"🧒 Childhood",q:"Did you have a nickname growing up? What's the story?"},
  {cat:"🧒 Childhood",q:"What's the best trouble you got into as a kid?"},
  {cat:"🧒 Childhood",q:"What book, show, or film from childhood shaped who you are?"},
  {cat:"✨ Right Now",q:"What's something you're really excited about lately?"},
  {cat:"✨ Right Now",q:"What song have you had on repeat this week?"},
  {cat:"✨ Right Now",q:"What have you been learning or exploring recently?"},
  {cat:"✨ Right Now",q:"What does a typical weekend look like for you right now?"},
  {cat:"🤪 Quirks",q:"What's a habit you have that most people would find strange?"},
  {cat:"🤪 Quirks",q:"What's something you're oddly competitive about?"},
  {cat:"🤪 Quirks",q:"What's a small luxury you absolutely refuse to give up?"},
  {cat:"🤪 Quirks",q:"What's a guilty pleasure you're not actually that guilty about?"},
  {cat:"🤪 Quirks",q:"What's the last thing that made you laugh until you cried?"},
  {cat:"🌟 Values",q:"What does a good friendship look like to you?"},
  {cat:"🌟 Values",q:"What's a cause you genuinely care about?"},
  {cat:"🌟 Values",q:"Do you think people can really change? What shaped that view?"},
  {cat:"🌟 Values",q:"What's something about the world you wish more people understood?"},
  {cat:"🌟 Values",q:"What's the most important quality in someone you spend time with?"},
  {cat:"🤔 Random",q:"If you could have dinner with anyone, living or dead, who would it be?"},
  {cat:"🤔 Random",q:"What superpower would you pick and what would you use it for?"},
  {cat:"🤔 Random",q:"Cats or dogs — and what does your answer say about you?"},
  {cat:"🤔 Random",q:"What's something you've changed your mind about in the last year?"},
  {cat:"🤔 Random",q:"What's the most spontaneous thing you've ever done?"},
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

// ── Room state ───────────────────────────────────────────────────────────────
// rooms[code] = { players: [{id, name, hand, answered, passes}x2], deck, phase, currentPlayer, respondingPlayer, playedCard, pTimer, aTimer }
const rooms = {};

function createRoom(code, customQ = []) {
  let allQ = [...BASE_QUESTIONS];
  customQ.forEach((qText, i) => {
    if (qText.trim()) allQ.push({ cat: '⭐ Custom', q: qText.trim() });
  });
  allQ = shuffle(allQ).map((q, i) => ({ ...q, id: i }));

  rooms[code] = {
    code,
    players: [],      // filled as players join
    deck: allQ,
    phase: 'waiting', // waiting | pick | answer | end
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

function dealCards(room, playerIdx, n = 5) {
  const p = room.players[playerIdx];
  while (p.hand.length < n && room.deck.length > 0) {
    p.hand.push(room.deck.shift());
  }
}

function broadcastState(room) {
  // Send each player their own private view
  room.players.forEach((p, idx) => {
    const opponent = room.players[1 - idx];
    io.to(p.id).emit('state', {
      phase: room.phase,
      myIndex: idx,
      currentPlayer: room.currentPlayer,
      respondingPlayer: room.respondingPlayer,
      myName: p.name,
      opponentName: opponent ? opponent.name : '...',
      myHand: p.hand,
      myAnswered: p.answered,
      opponentAnswered: opponent ? opponent.answered : 0,
      myPasses: p.passes,
      opponentPasses: opponent ? opponent.passes : 3,
      deckCount: room.deck.length,
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
      // Auto-play first card
      const cp = room.players[room.currentPlayer];
      if (cp && cp.hand.length > 0) {
        autoPlayCard(room, 0);
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
      io.to(room.players[0].id).emit('toast', "⏰ Time's up!");
      io.to(room.players[1].id).emit('toast', "⏰ Time's up!");
      nextTurn(room);
    }
  }, 1000);
}

function autoPlayCard(room, cardIdx) {
  const cp = room.players[room.currentPlayer];
  const card = cp.hand.splice(cardIdx, 1)[0];
  dealCards(room, room.currentPlayer);
  room.playedCard = card;
  room.phase = 'answer';
  broadcastState(room);
  startAnswerTimer(room);
}

function nextTurn(room) {
  const tmp = room.currentPlayer;
  room.currentPlayer = room.respondingPlayer;
  room.respondingPlayer = tmp;
  room.phase = 'pick';
  room.playedCard = null;

  const p0 = room.players[0], p1 = room.players[1];
  if (p0.hand.length === 0 && p1.hand.length === 0 && room.deck.length === 0) {
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

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // Host creates a room
  socket.on('create_room', ({ name, customQ }) => {
    let code;
    do { code = makeCode(); } while (rooms[code]);
    const room = createRoom(code, customQ || []);
    room.players.push({ id: socket.id, name: name || 'Player 1', hand: [], answered: 0, passes: 3 });
    dealCards(room, 0);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerIdx = 0;
    socket.emit('room_created', { code });
    socket.emit('waiting_for_opponent');
  });

  // Guest joins a room
  socket.on('join_room', ({ code, name }) => {
    const room = rooms[code.toUpperCase()];
    if (!room) { socket.emit('error_msg', 'Room not found. Check the code!'); return; }
    if (room.players.length >= 2) { socket.emit('error_msg', 'Room is already full!'); return; }
    if (room.phase !== 'waiting') { socket.emit('error_msg', 'Game already in progress!'); return; }

    room.players.push({ id: socket.id, name: name || 'Player 2', hand: [], answered: 0, passes: 3 });
    dealCards(room, 1);
    socket.join(code.toUpperCase());
    socket.data.roomCode = code.toUpperCase();
    socket.data.playerIdx = 1;

    // Game starts!
    room.phase = 'pick';
    broadcastState(room);
    startPlayTimer(room);
  });

  // Play a card
  socket.on('play_card', ({ cardIdx }) => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'pick') return;
    if (socket.data.playerIdx !== room.currentPlayer) return;
    const cp = room.players[room.currentPlayer];
    if (cardIdx < 0 || cardIdx >= cp.hand.length) return;

    clearInterval(room.pTimerInterval);
    autoPlayCard(room, cardIdx);
  });

  // Mark answered
  socket.on('mark_answered', () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'answer') return;
    // Only the current player (who played the card) can mark it answered
    if (socket.data.playerIdx !== room.currentPlayer) return;

    clearInterval(room.aTimerInterval);
    room.players[room.respondingPlayer].answered++;
    const rName = room.players[room.respondingPlayer].name;
    io.to(room.players[0].id).emit('toast', `✅ ${rName} answered!`);
    io.to(room.players[1].id).emit('toast', `✅ ${rName} answered!`);
    nextTurn(room);
  });

  // Pass
  socket.on('use_pass', () => {
    const room = rooms[socket.data.roomCode];
    if (!room || room.phase !== 'answer') return;
    // Only the responder can pass
    if (socket.data.playerIdx !== room.respondingPlayer) return;
    const rp = room.players[room.respondingPlayer];
    if (rp.passes <= 0) { socket.emit('toast', 'No passes left!'); return; }

    clearInterval(room.aTimerInterval);
    rp.passes--;
    io.to(room.players[0].id).emit('toast', `❤️ ${rp.name} passed (${rp.passes} left)`);
    io.to(room.players[1].id).emit('toast', `❤️ ${rp.name} passed (${rp.passes} left)`);
    nextTurn(room);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    // Notify opponent
    room.players.forEach(p => {
      if (p.id !== socket.id) {
        io.to(p.id).emit('opponent_left');
      }
    });
    // Clean up room after delay
    setTimeout(() => { delete rooms[code]; }, 30000);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎲 Curio server running on port ${PORT}`));
