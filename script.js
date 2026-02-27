const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const statusEl = document.getElementById('status');

const GRAVITY = 0.35;
const FLAP_STRENGTH = -6.5;
const PIPE_WIDTH = 64;
const PIPE_GAP = 150;
const PIPE_INTERVAL = 1300;
const GROUND_HEIGHT = 70;

let bird;
let pipes;
let score;
let bestScore = Number(localStorage.getItem('flappyBestScore') || 0);
let gameStarted;
let gameOver;
let lastPipeTime;

bestScoreEl.textContent = bestScore;

function resetGame() {
  bird = {
    x: 90,
    y: canvas.height / 2,
    radius: 16,
    velocity: 0,
    rotation: 0,
  };
  pipes = [];
  score = 0;
  gameStarted = false;
  gameOver = false;
  lastPipeTime = performance.now();
  scoreEl.textContent = score;
  statusEl.textContent = 'Ready';
}

function flap() {
  if (gameOver) return;
  if (!gameStarted) {
    gameStarted = true;
    statusEl.textContent = 'Flying';
  }
  bird.velocity = FLAP_STRENGTH;
}

function spawnPipe(now) {
  if (now - lastPipeTime < PIPE_INTERVAL) return;
  lastPipeTime = now;

  const minTop = 70;
  const maxTop = canvas.height - GROUND_HEIGHT - PIPE_GAP - 90;
  const topHeight = Math.random() * (maxTop - minTop) + minTop;

  pipes.push({
    x: canvas.width,
    topHeight,
    passed: false,
  });
}

function update(deltaTime, now) {
  if (!gameStarted || gameOver) return;

  bird.velocity += GRAVITY * (deltaTime / 16);
  bird.y += bird.velocity;
  bird.rotation = Math.min(Math.max(bird.velocity / 10, -0.8), 0.8);

  spawnPipe(now);

  for (const pipe of pipes) {
    pipe.x -= 2.2 * (deltaTime / 16);

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score += 1;
      scoreEl.textContent = score;
    }

    const inPipeX = bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH;
    const hitTop = bird.y - bird.radius < pipe.topHeight;
    const hitBottom = bird.y + bird.radius > pipe.topHeight + PIPE_GAP;

    if (inPipeX && (hitTop || hitBottom)) {
      endGame();
    }
  }

  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -10);

  if (bird.y + bird.radius > canvas.height - GROUND_HEIGHT || bird.y - bird.radius < 0) {
    endGame();
  }
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  statusEl.textContent = 'Game Over';

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBestScore', String(bestScore));
    bestScoreEl.textContent = bestScore;
  }
}

function drawBackground() {
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);

  ctx.fillStyle = '#86efac';
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 10);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(5, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(bird.radius - 2, 0);
  ctx.lineTo(bird.radius + 12, 4);
  ctx.lineTo(bird.radius - 2, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPipes() {
  for (const pipe of pipes) {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(pipe.x - 3, pipe.topHeight - 18, PIPE_WIDTH + 6, 18);
    ctx.fillRect(pipe.x - 3, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 6, 18);
  }
}

function drawOverlay() {
  if (!gameStarted) {
    ctx.fillStyle = 'rgb(15 23 42 / 65%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Tap to Start', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '18px system-ui';
    ctx.fillText('Avoid the pipes!', canvas.width / 2, canvas.height / 2 + 24);
  }

  if (gameOver) {
    ctx.fillStyle = 'rgb(15 23 42 / 68%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '20px system-ui';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 4);
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 36);
  }
}

let previous = performance.now();
function gameLoop(now) {
  const deltaTime = now - previous;
  previous = now;

  update(deltaTime, now);

  drawBackground();
  drawPipes();
  drawBird();
  drawOverlay();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    flap();
  }

  if (event.code === 'KeyR') {
    resetGame();
  }
});

window.addEventListener('pointerdown', () => {
  flap();
});

resetGame();
requestAnimationFrame(gameLoop);
