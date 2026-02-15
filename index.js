const socket = io("https://server.boxgame.shadyggs.xyz");
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let pName = "";

const input = document.getElementById("nameInput");
const button = document.getElementById("startBtn");

let myID = null;
let world = null;
let players = null;
let target = null;

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

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});

button.addEventListener("click", () => {
  pName = input.value.trim();
  if (pName.length === 0) return; // Don't allow empty names
  localStorage.setItem("name", pName);
  document.getElementById("nameScreen").style.display = "none";
  socket.emit("name", pName);
});

socket.on("init", (newWorld) => {
  world = newWorld;
  resizeCanvas();
});

socket.on("gameState", (state) => {
  ({ target, players } = state);
});

socket.on("serverFull", (msg) => {
  alert(msg);
});

socket.on("scoreEvent", (data) => {
  console.log(`${data.playerName} scored! Total: ${data.score}`);
});
