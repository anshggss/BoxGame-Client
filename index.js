const socket = io("http://localhost:3000");
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let pName = "";

const input = document.getElementById("nameInput");
const button = document.getElementById("startBtn");

if (localStorage.getItem("name")) {
  pName = localStorage.getItem("name");
  document.getElementById("nameScreen").style.display = "none";
  socket.emit("name", pName);
}

button.addEventListener("click", () => {
  pName = nameInput.value;
  localStorage.setItem("name", pName);
  document.getElementById("nameScreen").style.display = "none";
  socket.emit("name", pName);
});

let myID = null;
let world = null;
let players = null;

socket.on("connect", () => {
  console.log(socket.id);
  myID = socket.id;
});

socket.on("init", (newWorld) => {
  world = newWorld;
  resizeCanvas();
});

socket.on("config", (state) => {
  players = state;
});
