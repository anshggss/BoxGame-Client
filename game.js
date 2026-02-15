function resizeCanvas() {
  if (!world) return;
  canvas.width = world.resolution.x;
  canvas.height = world.resolution.y;
}
function handleClick() {}
let keys = {
  left: false,
  right: false,
  jump: false,
};
let prevKeys = { left: false, right: false, jump: false };

window.addEventListener("keydown", (e) => {
  if (e.key == "ArrowUp" || e.key == " " || e.key == "w" || e.key == "W") {
    keys.jump = true;
  }
  if (e.key == "ArrowLeft" || e.key == "a" || e.key == "A") {
    keys.left = true;
  }
  if (e.key == "ArrowRight" || e.key == "d" || e.key == "D") {
    keys.right = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key == "ArrowUp" || e.key == " " || e.key == "w" || e.key == "W") {
    keys.jump = false;
  }
  if (e.key == "ArrowLeft" || e.key == "a" || e.key == "A") {
    keys.left = false;
  }
  if (e.key == "ArrowRight" || e.key == "d" || e.key == "D") {
    keys.right = false;
  }
});

window.addEventListener("resize", resizeCanvas);

// Stars for background - pre-cached to offscreen canvas
let stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * 1280,
    y: Math.random() * 400,
    radius: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    twinkleSpeed: Math.random() * 0.03 + 0.01,
  });
}

// ============== PARTICLE POOL (object reuse, no splice) ==============
const MAX_PARTICLES = 150; // Hard cap
let particles = new Array(MAX_PARTICLES);
let particleCount = 0;

// Pre-allocate particle objects
for (let i = 0; i < MAX_PARTICLES; i++) {
  particles[i] = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    decay: 0,
    size: 0,
    color: "",
  };
}

function spawnParticles(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    if (particleCount >= MAX_PARTICLES) return; // hard cap
    let p = particles[particleCount];
    p.x = x;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 4;
    p.vy = (Math.random() - 0.5) * 4;
    p.life = 1.0;
    p.decay = Math.random() * 0.03 + 0.02;
    p.size = Math.random() * 4 + 2;
    p.color = color;
    particleCount++;
  }
}

function updateParticles() {
  let i = 0;
  while (i < particleCount) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      // Swap with last active particle (O(1) removal)
      particleCount--;
      let temp = particles[i];
      particles[i] = particles[particleCount];
      particles[particleCount] = temp;
      // Don't increment i — re-check swapped particle
    } else {
      i++;
    }
  }
}

function drawParticles() {
  for (let i = 0; i < particleCount; i++) {
    let p = particles[i];
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// For pulsing target
let time = 0;

// Preload heart image
const heartImage = new Image();
heartImage.src = "heart.png";

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============== CACHED BACKGROUND (only redrawn when needed) ==============
let bgCanvas = null;
let bgNeedsRedraw = true;

function ensureBgCanvas() {
  if (!bgCanvas) {
    bgCanvas = document.createElement("canvas");
  }
  if (bgCanvas.width !== canvas.width || bgCanvas.height !== canvas.height) {
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgNeedsRedraw = true;
  }
}

function drawBackgroundCached() {
  ensureBgCanvas();
  if (bgNeedsRedraw) {
    let bgCtx = bgCanvas.getContext("2d");
    let gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
    gradient.addColorStop(0, "#0a0015");
    gradient.addColorStop(0.5, "#1a0030");
    gradient.addColorStop(1, "#0d001a");
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgNeedsRedraw = false;
  }
  ctx.drawImage(bgCanvas, 0, 0);
}

function drawStars() {
  // Only update twinkle every 3rd frame to reduce sin() calls
  let updateTwinkle = time % 3 === 0;
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    if (updateTwinkle) {
      star._cachedAlpha =
        star.opacity * (Math.sin(time * star.twinkleSpeed) * 0.5 + 0.5);
    }
    ctx.globalAlpha = star._cachedAlpha || star.opacity;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlatforms(platforms) {
  // REMOVED expensive shadow effects
  for (let i = 0; i < platforms.length; i++) {
    let platform = platforms[i];
    let grad = ctx.createLinearGradient(
      platform.x,
      platform.y,
      platform.x,
      platform.y + platform.height,
    );
    grad.addColorStop(0, "#ff4444");
    grad.addColorStop(1, "#aa0000");

    ctx.fillStyle = grad;
    drawRoundedRect(platform.x, platform.y, platform.width, platform.height, 5);
    ctx.fill();

    // Simple top highlight (no shadow)
    ctx.fillStyle = "rgba(255, 150, 150, 0.3)";
    ctx.fillRect(platform.x + 2, platform.y, platform.width - 4, 3);
  }
}

function drawGround(ground) {
  let grad = ctx.createLinearGradient(
    ground.x,
    ground.y,
    ground.x,
    ground.y + ground.height,
  );
  grad.addColorStop(0, "#ff4444");
  grad.addColorStop(0.3, "#cc0000");
  grad.addColorStop(1, "#660000");

  ctx.fillStyle = grad;
  ctx.fillRect(ground.x, ground.y, ground.width, ground.height);

  ctx.strokeStyle = "rgba(255, 100, 100, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ground.x, ground.y);
  ctx.lineTo(ground.x + ground.width, ground.y);
  ctx.stroke();

  // Grid pattern — batch into single path
  ctx.strokeStyle = "rgba(255, 50, 50, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = ground.x; x < ground.x + ground.width; x += 40) {
    ctx.moveTo(x, ground.y);
    ctx.lineTo(x, ground.y + ground.height);
  }
  for (let y = ground.y; y < ground.y + ground.height; y += 40) {
    ctx.moveTo(ground.x, y);
    ctx.lineTo(ground.x + ground.width, y);
  }
  ctx.stroke(); // Single stroke call for entire grid
}

function drawTarget() {
  let pulse = Math.sin(time * 0.05) * 0.3 + 0.7;
  let size = target.width + Math.sin(time * 0.05) * 3;

  // REMOVED expensive shadow — use simple glow circle instead
  let cx = target.x + target.width / 2;
  let cy = target.y + target.height / 2;

  // Fake glow with a larger transparent circle
  ctx.globalAlpha = 0.2 + pulse * 0.15;
  ctx.fillStyle = "#00ff88";
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2 + 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
  grad.addColorStop(0, "#00ff88");
  grad.addColorStop(0.5, "#00cc44");
  grad.addColorStop(1, "#008800");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Rotating ring
  ctx.strokeStyle = "rgba(23, 154, 146, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    size / 2 + 8 + Math.sin(time * 0.03) * 3,
    time * 0.02,
    time * 0.02 + Math.PI * 1.5,
  );
  ctx.stroke();

  // Spawn particles less frequently
  if (time % 6 === 0) {
    spawnParticles(cx, cy, "#b7ff00ff", 1);
  }
}

// ============== CACHED LEADERBOARD (update every 30 frames) ==============
let cachedLeaderboard = [];
let leaderboardCacheFrame = -1;

function drawLeaderboard() {
  // Re-sort only every 30 frames
  if (time - leaderboardCacheFrame >= 30) {
    cachedLeaderboard = Object.values(players)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    leaderboardCacheFrame = time;
  }

  let topPlayers = cachedLeaderboard;
  let lbX = canvas.width - 260;
  let lbY = 10;
  let lbWidth = 250;
  let lbLineHeight = 35;
  let lbHeight = lbLineHeight * (topPlayers.length + 1) + 20;

  ctx.fillStyle = "rgba(10, 0, 30, 0.75)";
  drawRoundedRect(lbX, lbY, lbWidth, lbHeight, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 100, 100, 0.4)";
  ctx.lineWidth = 1;
  drawRoundedRect(lbX, lbY, lbWidth, lbHeight, 12);
  ctx.stroke();

  ctx.font = "bold 20px 'Segoe UI', Arial";
  ctx.fillStyle = "#ff6666";
  ctx.fillText("🏆 LEADERBOARD", lbX + 18, lbY + 30);

  let separatorGrad = ctx.createLinearGradient(
    lbX + 10,
    0,
    lbX + lbWidth - 10,
    0,
  );
  separatorGrad.addColorStop(0, "transparent");
  separatorGrad.addColorStop(0.5, "rgba(255, 100, 100, 0.5)");
  separatorGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = separatorGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lbX + 10, lbY + 42);
  ctx.lineTo(lbX + lbWidth - 10, lbY + 42);
  ctx.stroke();

  for (let index = 0; index < topPlayers.length; index++) {
    let player = topPlayers[index];
    let entryY = lbY + 70 + index * lbLineHeight;

    if (player.id === socket.id) {
      ctx.fillStyle = "rgba(255, 100, 100, 0.15)";
      drawRoundedRect(lbX + 5, entryY - 20, lbWidth - 10, lbLineHeight, 6);
      ctx.fill();
    }

    ctx.font = "bold 16px 'Segoe UI', Arial";
    if (index === 0) {
      ctx.fillStyle = "#ffd700";
      ctx.fillText("🥇", lbX + 12, entryY);
    } else if (index === 1) {
      ctx.fillStyle = "#c0c0c0";
      ctx.fillText("🥈", lbX + 12, entryY);
    } else if (index === 2) {
      ctx.fillStyle = "#cd7f32";
      ctx.fillText("🥉", lbX + 12, entryY);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`${index + 1}.`, lbX + 15, entryY);
    }

    ctx.font = "16px 'Segoe UI', Arial";
    ctx.fillStyle =
      player.id === socket.id ? "#ffaaaa" : "rgba(255,255,255,0.85)";
    let displayName = player.id === socket.id ? "You" : player.name;
    if (displayName.length > 10) displayName = displayName.slice(0, 10) + "..";
    ctx.fillText(displayName, lbX + 45, entryY);

    ctx.font = "bold 16px 'Segoe UI', Arial";
    ctx.fillStyle = "#00ffaa";
    ctx.textAlign = "right";
    ctx.fillText(player.score, lbX + lbWidth - 18, entryY);
    ctx.textAlign = "left";
  }
}

function drawPlayerScore() {
  if (!players[socket.id]) return;
  let myScore = players[socket.id].score;

  ctx.fillStyle = "rgba(10, 0, 30, 0.75)";
  drawRoundedRect(10, 10, 160, 50, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 100, 100, 0.4)";
  ctx.lineWidth = 1;
  drawRoundedRect(10, 10, 160, 50, 10);
  ctx.stroke();

  ctx.font = "bold 14px 'Segoe UI', Arial";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("YOUR SCORE", 25, 32);
  ctx.font = "bold 22px 'Segoe UI', Arial";
  ctx.fillStyle = "#00ffaa";
  ctx.fillText(myScore, 25, 55);
}

// Pre-compute the set for fast lookup
const tvishaNameSet = new Set([
  "t",
  "tis",
  "tvisha",
  "pis",
  "tv",
  "tisha",
  "tvi",
  "tvii",
  "tviii",
  "tviiii",
  "tviiiii",
  "tviiiiii",
  "tviiiiiii",
  "tviiiiiiii",
  "tis pis",
  "tispis",
]);

function drawPlayer(player, id) {
  if (tvishaNameSet.has(player.name)) {
    ctx.drawImage(heartImage, player.x, player.y, player.width, player.height);
  } else {
    let grad = ctx.createLinearGradient(
      player.x,
      player.y,
      player.x,
      player.y + player.height,
    );
    grad.addColorStop(0, player.color);
    grad.addColorStop(1, shadeColor(player.color, -40));
    ctx.fillStyle = grad;

    // REMOVED expensive shadow — use simple border glow instead
    drawRoundedRect(player.x, player.y, player.width, player.height, 6);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Eyes
    let eyeY = player.y + player.height * 0.35;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(player.x + player.width * 0.35, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(player.x + player.width * 0.65, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(player.x + player.width * 0.35, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(player.x + player.width * 0.65, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Name tag
  let displayName = id === socket.id ? "You" : player.name;
  ctx.font = "bold 14px 'Segoe UI', Arial";
  let textWidth = ctx.measureText(displayName).width;
  let tagX = player.x + player.width / 2 - textWidth / 2 - 8;
  let tagY = player.y - 28;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  drawRoundedRect(tagX, tagY, textWidth + 16, 22, 6);
  ctx.fill();

  ctx.fillStyle = id === socket.id ? "#00ffaa" : "white";
  ctx.fillText(displayName, tagX + 8, tagY + 16);

  // Trail particles — reduced frequency
  if ((player.velocityX !== 0 || player.velocityY !== 0) && time % 4 === 0) {
    spawnParticles(
      player.x + player.width / 2,
      player.y + player.height,
      player.color,
      1,
    );
  }
}

function shadeColor(color, percent) {
  let num = parseInt(color.replace("#", ""), 16);
  let amt = Math.round(2.55 * percent);
  let R = Math.max(Math.min(255, (num >> 16) + amt), 0);
  let G = Math.max(Math.min(255, ((num >> 8) & 0x00ff) + amt), 0);
  let B = Math.max(Math.min(255, (num & 0x0000ff) + amt), 0);
  return `rgb(${R},${G},${B})`;
}

function draw() {
  if (!world || !players || !target) return;
  time++;

  updateParticles();
  updateScorePopups();
  drawBackgroundCached();
  drawStars();
  drawPlatforms(world.platforms);
  drawTarget();
  drawGround(world.ground);
  drawParticles();
  drawLeaderboard();
  drawPlayerScore();

  for (const id in players) {
    drawPlayer(players[id], id);
  }
}

function update() {
  draw();
  requestAnimationFrame(update);
}
update();

// ============== SEND INPUTS ONLY ON CHANGE (not 120/sec blindly) ==============
setInterval(() => {
  if (
    keys.left !== prevKeys.left ||
    keys.right !== prevKeys.right ||
    keys.jump !== prevKeys.jump
  ) {
    socket.emit("inputs", keys);
    prevKeys.left = keys.left;
    prevKeys.right = keys.right;
    prevKeys.jump = keys.jump;
  }
}, 1000 / 120); // 60Hz is plenty, and only sends on change
