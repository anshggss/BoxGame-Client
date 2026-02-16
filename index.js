const socket = io("http://localhost:3000", {
  // Reduce reconnection spam
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket"], // Skip polling — go straight to WebSocket
});

let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let pName = "";

const input = document.getElementById("nameInput");
const button = document.getElementById("startBtn");

let myID = null;
let world = null;
let players = {}; // Initialize as empty object, not null
let target = null;

// ============== CONNECTION HANDLING ==============
socket.on("connect", () => {
  console.log("Connected:", socket.id);
  myID = socket.id;

  // Send stored name after connection
  if (localStorage.getItem("name")) {
    pName = localStorage.getItem("name");
    document.getElementById("nameScreen").style.display = "none";
    socket.emit("name", pName);
  }
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);
  // Clear stale player data on disconnect
  players = {};
  target = null;
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});

// ============== NAME INPUT ==============
button.addEventListener("click", submitName);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitName();
});

function submitName() {
  pName = input.value.trim();
  if (pName.length === 0) return;
  localStorage.setItem("name", pName);
  document.getElementById("nameScreen").style.display = "none";
  socket.emit("name", pName);
}

// ============== WORLD INIT ==============
socket.on("init", (newWorld) => {
  world = newWorld;
  resizeCanvas();
});

// ============== GAME STATE WITH DELTA MERGE ==============
socket.on("gameState", (state) => {
  // Always update target position
  if (state.target) {
    target = state.target;
  }

  if (!state.players) return;

  if (state.full) {
    // Full sync — replace entire players object
    players = state.players;
  } else {
    // Delta update — merge only changed players
    for (const id in state.players) {
      if (state.players[id] === null) {
        // Player disconnected — remove them
        delete players[id];
      } else {
        // Player updated or new — merge
        // If player already exists, update properties individually
        // to avoid creating a new object reference each tick
        if (players[id]) {
          const incoming = state.players[id];
          const existing = players[id];
          existing.x = incoming.x;
          existing.y = incoming.y;
          existing.width = incoming.width;
          existing.height = incoming.height;
          existing.color = incoming.color;
          existing.velocityX = incoming.velocityX;
          existing.velocityY = incoming.velocityY;
          existing.name = incoming.name;
          existing.score = incoming.score;
          existing.id = incoming.id;
        } else {
          // New player — add the whole object
          players[id] = state.players[id];
        }
      }
    }
  }

  // Update myID reference in case of reconnect
  if (socket.id && myID !== socket.id) {
    myID = socket.id;
  }
});

// ============== SERVER FULL ==============
socket.on("serverFull", (msg) => {
  alert(msg);
});

// ============== SCORE EVENTS — VISUAL FEEDBACK ==============
let scorePopups = [];

socket.on("scoreEvent", (data) => {
  // Add floating score popup
  scorePopups.push({
    text: `${data.playerName} +1`,
    x: data.x,
    y: data.y,
    life: 1.0,
    decay: 0.02,
  });

  // Spawn celebration particles at score location
  if (typeof spawnParticles === "function") {
    spawnParticles(data.x, data.y, "#00ff88", 8);
  }
});

// Update and draw score popups (call these from your draw loop)
function updateScorePopups() {
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    let popup = scorePopups[i];
    popup.y -= 1; // Float upward
    popup.life -= popup.decay;
    if (popup.life <= 0) {
      scorePopups.splice(i, 1);
    }
  }
}

function drawScorePopups() {
  for (let i = 0; i < scorePopups.length; i++) {
    let popup = scorePopups[i];
    ctx.globalAlpha = popup.life;
    ctx.font = "bold 16px 'Segoe UI', Arial";
    ctx.fillStyle = "#00ffaa";
    ctx.textAlign = "center";
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}
