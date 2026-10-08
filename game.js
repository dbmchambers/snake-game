// --- Supabase setup (URL and public key come from /api/config) ---
let db = null;

async function connect() {
  try {
    const res = await fetch('/api/config');
    const { url, key } = await res.json();
    if (!url || !key) throw new Error('Missing Supabase settings');
    db = supabase.createClient(url, key);
    loadLeaderboard();
  } catch (err) {
    document.getElementById('leaderboard').innerHTML = '<li>Leaderboard unavailable.</li>';
    console.error(err);
  }
}

async function saveScore(username, score) {
  if (!db) return;
  const { error } = await db.from('scores').insert({ username, score });
  if (error) console.error(error);
}

async function loadLeaderboard() {
  if (!db) return;
  const list = document.getElementById('leaderboard');
  const { data, error } = await db
    .from('scores')
    .select('username, score')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);
  if (error) { list.innerHTML = '<li>Could not load scores.</li>'; return; }
  list.innerHTML = '';
  if (data.length === 0) list.innerHTML = '<li>No scores yet. Be the first!</li>';
  for (const row of data) {
    const li = document.createElement('li');
    li.textContent = row.username;
    const s = document.createElement('span');
    s.className = 'score-val';
    s.textContent = row.score;
    li.appendChild(s);
    list.appendChild(li);
  }
}

// --- Username ---
const loginEl = document.getElementById('login');
const gameEl = document.getElementById('game');
let username = localStorage.getItem('snake-username') || '';

function showGame() {
  document.getElementById('player').textContent = username;
  loginEl.classList.add('hidden');
  gameEl.classList.remove('hidden');
  resetGame();
}

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('username').value.trim().slice(0, 20);
  if (!name) return;
  username = name;
  try { localStorage.setItem('snake-username', name); } catch {}
  showGame();
});

document.getElementById('change-name').addEventListener('click', () => {
  stop();
  gameEl.classList.add('hidden');
  loginEl.classList.remove('hidden');
  document.getElementById('username').value = username;
});

// --- Game ---
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const GRID = 20;
const CELL = canvas.width / GRID;
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

let snake, dir, nextDir, food, score, timer, running, over;

function resetGame() {
  stop();
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  running = false;
  over = false;
  scoreEl.textContent = 0;
  messageEl.textContent = 'Press an arrow key (or swipe) to start.';
  restartBtn.classList.add('hidden');
  placeFood();
  draw();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some((p) => p.x === food.x && p.y === food.y));
}

function start() {
  if (running || over) return;
  running = true;
  messageEl.textContent = '';
  timer = setInterval(tick, 110);
}

function stop() {
  clearInterval(timer);
  running = false;
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
  const hitSelf = snake.some((p) => p.x === head.x && p.y === head.y);
  if (hitWall || hitSelf) return gameOver();

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = score;
    placeFood();
  } else {
    snake.pop();
  }
  draw();
}

async function gameOver() {
  stop();
  over = true;
  messageEl.textContent = `Game over! You scored ${score}.`;
  restartBtn.classList.remove('hidden');
  await saveScore(username, score);
  loadLeaderboard();
}

function draw() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f87171';
  ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
  snake.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? '#86efac' : '#22c55e';
    ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function turn(x, y) {
  if (gameEl.classList.contains('hidden') || over) return;
  // Can't reverse straight back into yourself
  if (x === -dir.x && y === -dir.y) return;
  nextDir = { x, y };
  start();
}

const KEYS = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
};
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const k = KEYS[e.key];
  if (k) { e.preventDefault(); turn(...k); }
});

// Swipe controls for phones
let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
canvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
  else turn(0, Math.sign(dy));
  touchStart = null;
});

restartBtn.addEventListener('click', resetGame);

// --- Boot ---
if (username) {
  document.getElementById('username').value = username;
}
connect();
