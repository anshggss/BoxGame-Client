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

// Add event listener for keydowns and keyups
window.addEventListener("keydown", (e) => {
  if (e.key == "ArrowUp" || e.key == "W") {
    keys.jump = true;
  }
  if (e.key == "ArrowLeft" || e.key == "A") {
    keys.left = true;
  }
  if (e.key == "ArrowRight" || e.key == "D") {
    keys.right = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key == "ArrowUp" || e.key == "W") {
    keys.jump = false;
  }
  if (e.key == "ArrowLeft" || e.key == "A") {
    keys.left = false;
  }
  if (e.key == "ArrowRight" || e.key == "D") {
    keys.right = false;
  }
});

window.addEventListener("resize", resizeCanvas);

function draw() {
  // Make this function as default game loop
  if (!world || !players) return;
  const platform = world.platform;

  // Render canvas
  ctx.fillStyle = world.canvasColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = platform.color;
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

  for (const id in players) {
    let player = players[id];

    if (
      player.name == "t" ||
      player.name == "tis" ||
      player.name == "tvisha" ||
      player.name == "pis" ||
      player.name == "tv" ||
      player.name == "tisha" ||
      player.name == "tvi" ||
      player.name == "tvii" ||
      player.name == "tviii" ||
      player.name == "tviiii" ||
      player.name == "tviiiii" ||
      player.name == "tviiiiii" ||
      player.name == "tviiiiiii" ||
      player.name == "tviiiiiiii" ||
      player.name == "tis pis" ||
      player.name == "tispis"
    ) {
      const image = new Image(player.width, player.width);
      image.src = "heart.png";
      ctx.drawImage(image, player.x, player.y, player.width, player.height);
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(player.name, player.x, player.y - 10);
    } else {
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);

      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(player.name, player.x, player.y - 10);
    }
  }
}

function update() {
  draw();

  requestAnimationFrame(update);
}
update();
setInterval(() => {
  socket.emit("inputs", keys);
}, 1000 / 60);
