const GRID_SIZE = 24;
const CELL_SIZE = 20;
const START_SPEED_MS = 145;
const MIN_SPEED_MS = 65;
const LEVEL_STEP = 5;
const POWER_FOOD_CHANCE = 0.18;
const POWER_DURATION_MS = 5500;
const MAX_LIVES = 3;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const speedEl = document.getElementById('speed');
const foodsEatenEl = document.getElementById('foodsEaten');
const powerFoodsEl = document.getElementById('powerFoods');
const longestSnakeEl = document.getElementById('longestSnake');
const timeSurvivedEl = document.getElementById('timeSurvived');

const overlay = document.getElementById('overlay');
const overlayMessageEl = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

const state = {
  running: false,
  paused: false,
  gameOver: false,
  score: 0,
  highScore: Number(localStorage.getItem('nova-snake-high-score') || 0),
  lives: MAX_LIVES,
  level: 1,
  tickMs: START_SPEED_MS,
  lastTickAt: 0,
  startTime: 0,
  elapsedMs: 0,
  foodsEaten: 0,
  powerFoods: 0,
  longestSnake: 3,
  powerModeUntil: 0,
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: { x: 9, y: 8, power: false }
};

function initSnake() {
  state.snake = [
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 3, y: 6 }
  ];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
}

function randomCell() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
  };
}

function cellOnSnake(cell) {
  return state.snake.some((part) => part.x === cell.x && part.y === cell.y);
}

function spawnFood() {
  let spot = randomCell();
  while (cellOnSnake(spot)) {
    spot = randomCell();
  }
  state.food = {
    ...spot,
    power: Math.random() < POWER_FOOD_CHANCE
  };
}

function resetGame() {
  state.running = false;
  state.paused = false;
  state.gameOver = false;
  state.score = 0;
  state.lives = MAX_LIVES;
  state.level = 1;
  state.tickMs = START_SPEED_MS;
  state.lastTickAt = 0;
  state.startTime = 0;
  state.elapsedMs = 0;
  state.foodsEaten = 0;
  state.powerFoods = 0;
  state.longestSnake = 3;
  state.powerModeUntil = 0;
  initSnake();
  spawnFood();
  updateHud();
  showOverlay('Press Start Game to begin!');
  draw();
}

function startGame() {
  if (state.running && !state.gameOver) {
    return;
  }
  if (state.gameOver) {
    resetGame();
  }
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.startTime = performance.now();
  state.lastTickAt = performance.now();
  hideOverlay();
}

function togglePause() {
  if (!state.running || state.gameOver) {
    return;
  }
  state.paused = !state.paused;
  if (state.paused) {
    showOverlay('Paused. Press P or Pause to continue.');
  } else {
    hideOverlay();
    state.lastTickAt = performance.now();
  }
}

function loseLife() {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.gameOver = true;
    state.running = false;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('nova-snake-high-score', String(state.highScore));
    }
    showOverlay(`Game over! Final score: ${state.score}. Press Restart or R.`);
    return;
  }

  initSnake();
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  spawnFood();
  showOverlay(`Life lost! ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} remaining.`);
  state.paused = true;
}

function addScore(amount) {
  state.score += amount;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('nova-snake-high-score', String(state.highScore));
  }
}

function updateLevelAndSpeed() {
  const level = 1 + Math.floor(state.foodsEaten / LEVEL_STEP);
  state.level = level;

  const base = START_SPEED_MS - (level - 1) * 10;
  const inPower = performance.now() < state.powerModeUntil;
  const powerModifier = inPower ? 25 : 0;
  state.tickMs = Math.max(MIN_SPEED_MS, base + powerModifier);
}

function step() {
  state.direction = { ...state.nextDirection };
  const head = state.snake[0];
  const next = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y
  };

  const wallHit = next.x < 0 || next.y < 0 || next.x >= GRID_SIZE || next.y >= GRID_SIZE;
  const bodyHit = state.snake.some((part) => part.x === next.x && part.y === next.y);

  if (wallHit || bodyHit) {
    loseLife();
    updateHud();
    return;
  }

  state.snake.unshift(next);

  const ateFood = next.x === state.food.x && next.y === state.food.y;
  if (ateFood) {
    state.foodsEaten += 1;
    if (state.food.power) {
      state.powerFoods += 1;
      state.powerModeUntil = performance.now() + POWER_DURATION_MS;
      addScore(35);
    } else {
      addScore(10);
    }
    spawnFood();
  } else {
    state.snake.pop();
  }

  state.longestSnake = Math.max(state.longestSnake, state.snake.length);
  updateLevelAndSpeed();
  updateHud();
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  highScoreEl.textContent = String(state.highScore);
  levelEl.textContent = String(state.level);
  livesEl.textContent = String(state.lives);
  speedEl.textContent = `${(START_SPEED_MS / state.tickMs).toFixed(2)}x`;
  foodsEatenEl.textContent = String(state.foodsEaten);
  powerFoodsEl.textContent = String(state.powerFoods);
  longestSnakeEl.textContent = String(state.longestSnake);
  timeSurvivedEl.textContent = formatTime(state.elapsedMs);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(95, 130, 200, 0.17)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const p = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function drawCell(x, y, color, radius = 5) {
  const px = x * CELL_SIZE;
  const py = y * CELL_SIZE;
  ctx.fillStyle = color;
  const w = CELL_SIZE - 1;
  const h = CELL_SIZE - 1;

  ctx.beginPath();
  ctx.roundRect(px + 1, py + 1, w - 2, h - 2, radius);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  state.snake.forEach((part, index) => {
    drawCell(part.x, part.y, index === 0 ? '#2df07f' : '#58e68d', index === 0 ? 6 : 4);
  });

  const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 110);
  const foodColor = state.food.power
    ? `rgba(190, 125, 255, ${pulse})`
    : '#ffc75f';

  drawCell(state.food.x, state.food.y, foodColor, state.food.power ? 8 : 5);

  if (performance.now() < state.powerModeUntil) {
    ctx.fillStyle = 'rgba(190, 125, 255, 0.17)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function showOverlay(message) {
  overlayMessageEl.textContent = message;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function setDirection(x, y) {
  if (!state.running || state.paused || state.gameOver) {
    return;
  }

  const current = state.direction;
  if (current.x === -x && current.y === -y) {
    return;
  }

  state.nextDirection = { x, y };
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
  }

  if (key === 'arrowup' || key === 'w') setDirection(0, -1);
  if (key === 'arrowdown' || key === 's') setDirection(0, 1);
  if (key === 'arrowleft' || key === 'a') setDirection(-1, 0);
  if (key === 'arrowright' || key === 'd') setDirection(1, 0);

  if (key === 'p') togglePause();
  if (key === 'r') {
    resetGame();
    startGame();
  }
});

startBtn.addEventListener('click', () => {
  if (state.paused) {
    togglePause();
    return;
  }
  startGame();
});

pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', () => {
  resetGame();
  startGame();
});

function frame(now) {
  if (state.running && !state.paused && !state.gameOver) {
    if (state.startTime > 0) {
      state.elapsedMs = now - state.startTime;
    }

    if (now - state.lastTickAt >= state.tickMs) {
      step();
      state.lastTickAt = now;
    }
  }

  if (state.running && !state.gameOver && !state.paused && performance.now() >= state.powerModeUntil) {
    updateLevelAndSpeed();
  }

  updateHud();
  draw();
  requestAnimationFrame(frame);
}

resetGame();
highScoreEl.textContent = String(state.highScore);
requestAnimationFrame(frame);
