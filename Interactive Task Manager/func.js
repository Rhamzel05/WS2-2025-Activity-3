const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const template = document.getElementById('taskTemplate');
const lists = {
  todo: document.getElementById('todo'),
  inprogress: document.getElementById('inprogress'),
  done: document.getElementById('done'),
};
const LS_KEY = 'task_manager_v1';
let tasks = load() || seedData();

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}
function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)); }
  catch { return null; }
}
function seedData() {
  return [
    { id: uid(), text: 'Complete project proposal', priority: 'high', status: 'todo' },
    { id: uid(), text: 'Review code changes', priority: 'medium', status: 'todo' },
    { id: uid(), text: 'Organize team meeting', priority: 'low', status: 'todo' },
    { id: uid(), text: 'Update documentation', priority: 'medium', status: 'inprogress' },
    { id: uid(), text: 'Fix critical bug', priority: 'high', status: 'done' },
  ];
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function render() {
  Object.values(lists).forEach(list => list.innerHTML = '');
  for (const t of tasks) {
    const el = taskElement(t);
    lists[t.status].appendChild(el);
  }
  applySearchFilter(searchInput.value.trim());
  updateCounts();
}
function updateCounts() {
  document.getElementById('count-todo').textContent = tasks.filter(t=>t.status==='todo').length;
  document.getElementById('count-inprogress').textContent = tasks.filter(t=>t.status==='inprogress').length;
  document.getElementById('count-done').textContent = tasks.filter(t=>t.status==='done').length;
}
function taskElement(task) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.id = task.id;
  node.classList.add(`priority-${task.priority}`);
  node.querySelector('.task-text').textContent = task.text;
  node.addEventListener('click', () => {
    document.querySelectorAll('.task.selected').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');
  });
  node.querySelector('.task-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    removeTask(task.id);
  });
  node.addEventListener('dragstart', onDragStart);
  node.addEventListener('dragend', onDragEnd);
  const textEl = node.querySelector('.task-text');
  let before = '';
  textEl.addEventListener('dblclick', () => {
    before = textEl.textContent;
    textEl.setAttribute('contenteditable', 'true');
    textEl.focus();
    placeCaretAtEnd(textEl);
  });
  textEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); }
    if (e.key === 'Escape') {
      textEl.textContent = before;
      textEl.blur();
    }
  });
  textEl.addEventListener('blur', () => {
    textEl.removeAttribute('contenteditable');
    const newText = textEl.textContent.trim();
    if (!newText) { textEl.textContent = before; return; }
    if (newText !== before) {
      updateTask(task.id, { text: newText });
    }
  });
  return node;
}
function placeCaretAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  const priority = prioritySelect.value;
  tasks.push({ id: uid(), text, priority, status: 'todo' });
  taskInput.value = '';
  render(); save();
}
function updateTask(id, patch) {
  const i = tasks.findIndex(t => t.id === id);
  if (i === -1) return;
  tasks[i] = { ...tasks[i], ...patch };
  render(); save();
}
function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  render(); save();
}
let dragId = null;
function onDragStart(e) {
  dragId = e.currentTarget.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}
function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  dragId = null;
}
for (const col of document.querySelectorAll('.column')) {
  const list = col.querySelector('.task-list');
  ['dragover','dragenter'].forEach(evt =>
    list.addEventListener(evt, (e) => {
      e.preventDefault();
      col.classList.add('drop-target');
      e.dataTransfer.dropEffect = 'move';
    })
  );
  list.addEventListener('dragleave', () => col.classList.remove('drop-target'));
  list.addEventListener('drop', (e) => {
    e.preventDefault();
    col.classList.remove('drop-target');
    if (!dragId) return;
    const status = col.dataset.status;
    updateTask(dragId, { status });
  });
}
function applySearchFilter(q) {
  q = q.toLowerCase();
  for (const el of document.querySelectorAll('.task')) {
    const text = el.querySelector('.task-text').textContent.toLowerCase();
    el.style.display = text.includes(q) ? '' : 'none';
  }
}
searchInput.addEventListener('input', (e) => applySearchFilter(e.target.value));
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  applySearchFilter('');
});
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});
window.addEventListener('keydown', (e) => {

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.altKey && (e.key.toLowerCase() === 'n')) {
    taskInput.focus();
  }
  if (e.key === 'Delete') {
    const sel = document.querySelector('.task.selected');
    if (sel) removeTask(sel.dataset.id);
  }
});
render();
save(); 
