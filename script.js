/* ---------- STATE & REFS ---------- */
const STORAGE_KEY = 'cool-todo:v1';
let tasks = [];
let filter = 'all';

const taskInput = document.getElementById('taskInput');
const taskListEl = document.getElementById('taskList');
const totalEl = document.getElementById('total');
const doneEl = document.getElementById('done');

/* ---------- AUDIO ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playDing() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Rich tone
  osc.type = 'triangle';

  // Pitch sweep (nice "ding" feel)
  osc.frequency.setValueAtTime(900, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    400,
    audioCtx.currentTime + 0.7   // pitch sweep within 0.7s
  );

  // Loud but safe volume
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.7,                         //  loud
    audioCtx.currentTime + 0.05
  );
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.8   // fades out at 0.8s
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.8); 
}

/* ---------- HELPERS ---------- */
function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
  catch(e){ console.warn('Save failed', e); }
}
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch(e) { console.warn('Load failed', e); tasks = []; }
}

/* ---------- CRUD ---------- */
function addTask(text) {
  tasks.unshift({ id: makeId(), text, done: false });
  saveTasks();
  renderTasks();
}
function addTaskFromInput() {
  const text = taskInput.value.trim();
  if (!text) return;
  addTask(text);
  taskInput.value = '';
  taskInput.focus();
}
function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTasks();
  renderTasks();
  if (t.done) playDing();
}
function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveTasks(); renderTasks();
}
function clearCompleted() {
  tasks = tasks.filter(x => !x.done);
  saveTasks(); renderTasks();
}

/* ---------- FILTERS ---------- */
function setFilter(type) { filter = type; renderTasks(); }
function getFilteredTasks() {
  if (filter === 'active') return tasks.filter(t => !t.done);
  if (filter === 'done') return tasks.filter(t => t.done);
  return tasks;
}

/* ---------- RENDER ---------- */
function renderTasks() {
  totalEl.textContent = tasks.length;
  doneEl.textContent = tasks.filter(t => t.done).length;

  taskListEl.innerHTML = '';
  const list = getFilteredTasks();

  if (list.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No tasks yet';
    li.style.opacity = '0.6';
    taskListEl.appendChild(li);
    return;
  }

  list.forEach(task => {
    const li = document.createElement('li');

    // Layout
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.justifyContent = 'space-between';

    if (task.done) li.classList.add('done');
    li.dataset.id = task.id;

    // TASK TEXT (LEFT)
    const text = document.createElement('div');
    text.className = 'task-text';
    text.textContent = task.text;
    text.tabIndex = 0;

    text.addEventListener('click', () => toggleDone(task.id));
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDone(task.id);
      }
    });

    // RIGHT SIDE HOLDER
    const rightBox = document.createElement('div');
    rightBox.style.display = 'flex';
    rightBox.style.alignItems = 'center';
    rightBox.style.gap = '10px';

    // TICK (shown ONLY when done)
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = '✅';

    // DELETE (shown ONLY when NOT done)
    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = 'X';
    del.title = 'Delete task';

    del.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    //  SHOW / HIDE LOGIC
    if (task.done) {
      del.style.display = 'none';   //  remove cross
      tick.style.display = 'inline'; //  show tick
    } else {
      del.style.display = 'inline'; //  show cross
      tick.style.display = 'none';  // hide tick
    }

    rightBox.appendChild(tick);
    rightBox.appendChild(del);

    li.appendChild(text);
    li.appendChild(rightBox);
    taskListEl.appendChild(li);
  });
}
/* ---------- EVENT WIRING ---------- */
document.querySelector('.input-box button')?.addEventListener('click', addTaskFromInput);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTaskFromInput(); });
document.querySelectorAll('.filters button').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.textContent.toLowerCase() === 'all' ? 'all' : btn.textContent.toLowerCase() === 'active' ? 'active' : 'done'));
});
document.querySelector('.clear')?.addEventListener('click', clearCompleted);

/* ---------- INIT ---------- */
loadTasks();
renderTasks();

const toggleBtn = document.getElementById("themeToggle");

// Load theme on page load
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
  toggleBtn.textContent = "☀️";
}

// Toggle theme on click
toggleBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");

  if (document.documentElement.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    toggleBtn.textContent = "☀️";
  } else {
    localStorage.setItem("theme", "light");
    toggleBtn.textContent = "🌙";
  }
});