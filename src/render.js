// Everything that draws the UI from the state object.
// User text is only ever added with textContent (never innerHTML).
import { getVisibleTasks, countActive, progressPercent } from './tasks.js';

const ITEM_CLASS =
    'flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/40';
const BADGE_BASE = 'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold';
const BADGES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
};
const ICON_BUTTON =
    'shrink-0 rounded-lg p-2 text-lg hover:bg-slate-200 dark:hover:bg-slate-600';
const FILTER_BASE = 'rounded-lg px-3 py-1.5 text-sm font-medium';
const FILTER_ON = 'bg-teal-600 text-white';
const FILTER_OFF =
    'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600';

// Shortcut for document.getElementById.
const $ = (id) => document.getElementById(id);


// Create an element with classes and optional text (textContent keeps it safe).
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Build the checkbox that toggles a task.
function createCheckbox(task) {
  const box = el('input', 'h-5 w-5 shrink-0 cursor-pointer accent-teal-600');
  box.type = 'checkbox';
  box.checked = task.done;
  box.dataset.action = 'toggle';
  box.dataset.focusKey = `toggle-${task.id}`;
  box.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`);
  return box;
}

// Build the task text (crossed out when the task is done).
function createText(task) {
  const doneClass = task.done ? ' text-slate-400 line-through dark:text-slate-500' : '';
  const span = el('span', `min-w-0 flex-1 cursor-text break-words${doneClass}`, task.text);
  span.dataset.role = 'text';
  span.title = 'Double-click to edit';
  return span;
}

// Build the colored priority badge.
function createBadge(task) {
  const priority = task.priority in BADGES ? task.priority : 'medium';
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return el('span', `${BADGE_BASE} ${BADGES[priority]}`, label);
}

// Build an icon button with an aria-label for screen readers.
function createIconButton(task, action, symbol, label) {
  const button = el('button', ICON_BUTTON, symbol);
  button.type = 'button';
  button.dataset.action = action;
  button.dataset.focusKey = `${action}-${task.id}`;
  button.setAttribute('aria-label', `${label}: ${task.text}`);
  return button;
}

// Build the edit input (and error message) shown while editing.
function createEditForm(task, edit) {
  const wrap = el('div', 'min-w-0 flex-1');
  const input = el('input', 'w-full rounded-lg border border-indigo-400 bg-white px-3 py-2 dark:bg-slate-700');
  input.type = 'text';
  input.value = edit.draft ?? task.text;
  input.dataset.editInput = 'true';
  input.setAttribute('aria-label', 'Edit task text');
  input.setAttribute('aria-invalid', edit.error ? 'true' : 'false');
  wrap.append(input);
  if (edit.error) {
    const error = el('p', 'mt-1 text-sm text-red-600 dark:text-red-400', edit.error);
    error.setAttribute('role', 'alert');
    wrap.append(error);
  }
  wrap.append(el('p', 'mt-1 text-xs text-slate-500 dark:text-slate-400', 'Enter to save, Escape to cancel'));
  return wrap;
}

// Build one <li> for a task, in view mode or edit mode.
function createTaskItem(task, edit) {
  const item = el('li', ITEM_CLASS);
  item.dataset.id = task.id;
  if (edit && edit.id === task.id) {
    item.append(createEditForm(task, edit));
    return item;
  }
  item.append(
      createCheckbox(task),
      createText(task),
      createBadge(task),
      createIconButton(task, 'edit', '✏️', 'Edit task'),
      createIconButton(task, 'delete', '🗑️', 'Delete task')
  );
  return item;
}

// Redraw the task list and return how many tasks are visible.
function renderList(state) {
  const visible = getVisibleTasks(state.tasks, state.filter, state.search, state.sort);
  $('task-list').replaceChildren(...visible.map((task) => createTaskItem(task, state.edit)));
  return visible.length;
}

// Pick the friendly message for an empty list.
function emptyMessage(state) {
  if (state.tasks.length === 0) return 'No tasks yet. Add your first study task above!';
  if (state.search.trim() !== '') return 'No tasks match your search.';
  if (state.filter === 'active') return 'Nothing left to do. Great work! 🎉';
  if (state.filter === 'completed') return 'No completed tasks yet. Finish one and it shows up here.';
  return 'No tasks to show.';
}

// Show or hide the empty-state message.
function renderEmpty(state, visibleCount) {
  const empty = $('empty-state');
  empty.hidden = visibleCount > 0;
  if (visibleCount === 0) empty.textContent = emptyMessage(state);
}
// Update the progress bar and its percentage text.
function renderProgress(state) {
  const percent = progressPercent(state.tasks);
  $('progress-fill').style.width = `${percent}%`;
  $('progress-text').textContent = `${percent}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(percent));
}
// Show "N task(s) left" with correct singular/plural.
function renderCounter(state) {
  const count = countActive(state.tasks);
  $('counter').textContent = `${count} ${count === 1 ? 'task' : 'tasks'} left`;
}

// Update the progress bar and its percentage text.
function renderProgress(state) {
  const percent = progressPercent(state.tasks);
  $('progress-fill').style.width = `${percent}%`;
  $('progress-text').textContent = `${percent}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(percent));
}

// Highlight the active filter button.
function renderFilters(state) {
  document.querySelectorAll('#filters button').forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.className = `${FILTER_BASE} ${isActive ? FILTER_ON : FILTER_OFF}`;
    button.setAttribute('aria-pressed', String(isActive));
  });
}

// Update the add-form error, sort select and clear-completed button.
function renderControls(state) {
  $('form-error').hidden = state.formError === '';
  $('form-error').textContent = state.formError;
  $('task-input').setAttribute('aria-invalid', String(state.formError !== ''));
  $('sort-select').value = state.sort;
  $('clear-completed').disabled = !state.tasks.some((task) => task.done);
}

// Open or close the delete confirmation dialog to match the state.
function syncDialog(state) {
  const dialog = $('confirm-dialog');
  const task = state.tasks.find((item) => item.id === state.pendingDeleteId);
  if (task && !dialog.open) {
    $('confirm-text').textContent = task.text;
    dialog.showModal();
  } else if (!task && dialog.open) {
    dialog.close();
  }
}

// Put the cursor in the edit input when a task is being edited.
function focusEditInput() {
  const input = document.querySelector('[data-edit-input]');
  if (!input) return;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

// Redraw the whole UI from state, keeping keyboard focus where it was.
export function render(state) {
  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.focusKey : undefined;
  const visibleCount = renderList(state);
  renderEmpty(state, visibleCount);
  renderCounter(state);
  renderProgress(state);
  renderFilters(state);
  renderControls(state);
  if (focusKey) {
    const again = document.querySelector(`[data-focus-key="${focusKey}"]`);
    if (again) again.focus();
  }
  focusEditInput();
  syncDialog(state);
}