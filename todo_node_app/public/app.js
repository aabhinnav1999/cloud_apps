let todos = [];
let filter = "all";

const els = {
  form: document.getElementById("todoForm"),
  input: document.getElementById("todoInput"),
  list: document.getElementById("todoList"),
  countActive: document.getElementById("countActive"),
  countCompleted: document.getElementById("countCompleted"),
  clearCompleted: document.getElementById("clearCompleted"),
  filterBtns: Array.from(document.querySelectorAll("[data-filter]")),
};

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

function filteredTodos() {
  if (filter === "active") return todos.filter((t) => !t.completed);
  if (filter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function updateCounts() {
  const active = todos.filter((t) => !t.completed).length;
  const completed = todos.filter((t) => t.completed).length;
  els.countActive.textContent = active;
  els.countCompleted.textContent = completed;
}

function setFilter(next) {
  filter = next;
  els.filterBtns.forEach((b) => b.classList.toggle("active", b.dataset.filter === filter));
  render();
}

function render() {
  updateCounts();

  const items = filteredTodos();
  if (items.length === 0) {
    els.list.innerHTML = `
      <li class="p-6 text-slate-500 text-sm">
        No tasks here. Add one above 👆
      </li>`;
    return;
  }

  els.list.innerHTML = items
    .map(
      (t) => `
      <li class="todo-item">
        <input type="checkbox" ${t.completed ? "checked" : ""} data-action="toggle" data-id="${t.id}" class="h-5 w-5 accent-slate-200" />
        <div
          class="todo-text ${t.completed ? "completed" : ""} cursor-text select-none"
          data-action="edit"
          data-id="${t.id}"
          title="Click to edit"
        >${escapeHtml(t.text)}</div>
        <button data-action="delete" data-id="${t.id}" class="text-slate-400 hover:text-slate-200 text-sm">Delete</button>
      </li>
    `
    )
    .join("");
}

async function load() {
  todos = await api("/api/todos");
  setFilter("all");
}

async function addTodo(text) {
  const todo = await api("/api/todos", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  todos.unshift(todo);
  render();
}

async function toggleTodo(id, completed) {
  const updated = await api(`/api/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
  todos = todos.map((t) => (t.id === id ? updated : t));
  render();
}

async function deleteTodo(id) {
  await api(`/api/todos/${id}`, { method: "DELETE" });
  todos = todos.filter((t) => t.id !== id);
  render();
}

async function editTodo(id, newText) {
  const updated = await api(`/api/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ text: newText }),
  });
  todos = todos.map((t) => (t.id === id ? updated : t));
  render();
}

async function clearCompleted() {
  await api("/api/todos", { method: "DELETE" });
  todos = todos.filter((t) => !t.completed);
  render();
}

// --- events ---
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;
  els.input.value = "";
  try {
    await addTodo(text);
  } catch (err) {
    alert(err.message);
  }
});

els.list.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  try {
    if (action === "toggle") {
      await toggleTodo(id, btn.checked);
    } else if (action === "delete") {
      await deleteTodo(id);
    } else if (action === "edit") {
      const current = todos.find((t) => t.id === id)?.text || "";
      const next = prompt("Edit task:", current);
      if (next === null) return; // cancelled
      const trimmed = next.trim();
      if (!trimmed) return;
      await editTodo(id, trimmed);
    }
  } catch (err) {
    alert(err.message);
  }
});

// Double click on text to toggle quickly
els.list.addEventListener("dblclick", async (e) => {
  const el = e.target.closest('[data-action="edit"]');
  if (!el) return;
  const id = el.dataset.id;
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  try {
    await toggleTodo(id, !t.completed);
  } catch (err) {
    alert(err.message);
  }
});

els.clearCompleted.addEventListener("click", async () => {
  try {
    await clearCompleted();
  } catch (err) {
    alert(err.message);
  }
});

els.filterBtns.forEach((b) =>
  b.addEventListener("click", () => setFilter(b.dataset.filter))
);

// start
load().catch((e) => alert(e.message));
