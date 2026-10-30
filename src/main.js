// Study Planner: state, event handlers and start-up code.
import { loadData, saveData, loadTheme, saveTheme } from './storage.js';
import {
  validateText, createTask, toggleTask, editTask,
  removeTask, removeCompleted,
} from './tasks.js';
import { render } from './render.js';

const saved = loadData();

// The single source of truth: the UI is always drawn from this object.
const state = {
  tasks: saved.tasks,       // array of task objects
  filter: saved.filter,     // 'all' | 'active' | 'completed'
  sort: saved.sort,         // 'created' | 'priority'
  search: '',               // text typed in the search box
  edit: null,               // { id, draft, error } while editing a task
  pendingDeleteId: null,    // id waiting for delete confirmation
  formError: '',            // error message under the add form
};

const taskInput = document.getElementById('task-input');
const list = document.getElementById('task-list');

// Change data, save it to localStorage, then redraw.
function updateState(changeFn) {
  changeFn();
  saveData({ tasks: state.tasks, filter: state.filter, sort: state.sort });
  render(state);
}

// Change temporary UI state (not saved), then redraw.
function updateView(changeFn) {
  changeFn();
  render(state);
}

// Move keyboard focus to a task control after a redraw.
function focusControl(key) {
  const control = document.querySelector(`[data-focus-key="${key}"]`);
  if (control) control.focus();
}

// Add a task from the form after validating it.
function handleAdd(event) {
  event.preventDefault();
  const error = validateText(taskInput.value);
  if (error) {
    updateView(() => { state.formError = error; });
    taskInput.focus();
    return;
  }
  const priority = document.getElementById('priority-select').value;
  updateState(() => {
    state.tasks.push(createTask(taskInput.value, priority));
    state.formError = '';
  });
  taskInput.value = '';
  taskInput.focus();
}

// Hide the form error as soon as the user starts typing again.
function handleTyping() {
  if (state.formError !== '') updateView(() => { state.formError = ''; });
}

// Start editing one task.
function startEdit(id) {
  updateView(() => { state.edit = { id, draft: null, error: '' }; });
}

// Save the edited text, or show an error if it is not valid.
function saveEdit(id, value) {
  const error = validateText(value);
  if (error) {
    updateView(() => { state.edit = { id, draft: value, error }; });
    return;
  }
  updateState(() => {
    editTask(state.tasks, id, value);
    state.edit = null;
  });
  focusControl(`edit-${id}`);
}

// Leave edit mode without saving.
function cancelEdit(id) {
  updateView(() => { state.edit = null; });
  focusControl(`edit-${id}`);
}

// Checkbox changes (event delegation on the list).
function handleListChange(event) {
  const item = event.target.closest('li[data-id]');
  if (!item || event.target.dataset.action !== 'toggle') return;
  updateState(() => toggleTask(state.tasks, item.dataset.id));
}

// Edit and delete button clicks (event delegation on the list).
function handleListClick(event) {
  const button = event.target.closest('button[data-action]');
  const item = event.target.closest('li[data-id]');
  if (!button || !item) return;
  if (button.dataset.action === 'edit') startEdit(item.dataset.id);
  if (button.dataset.action === 'delete') {
    updateView(() => { state.pendingDeleteId = item.dataset.id; });
  }
}

// Double-click on the task text starts editing.
function handleListDoubleClick(event) {
  const item = event.target.closest('li[data-id]');
  if (item && event.target.dataset.role === 'text') startEdit(item.dataset.id);
}

// Enter saves and Escape cancels while editing.
function handleListKeydown(event) {
  if (!event.target.matches('[data-edit-input]')) return;
  const item = event.target.closest('li[data-id]');
  if (event.key === 'Enter') {
    event.preventDefault();
    saveEdit(item.dataset.id, event.target.value);
  } else if (event.key === 'Escape') {
    cancelEdit(item.dataset.id);
  }
}

// Delete the task the user confirmed.
function confirmDelete() {
  updateState(() => {
    state.tasks = removeTask(state.tasks, state.pendingDeleteId);
    state.pendingDeleteId = null;
  });
  taskInput.focus();
}

// Close the dialog (Cancel button or Escape key) without deleting.
function cancelDelete() {
  if (state.pendingDeleteId === null) return;
  updateView(() => { state.pendingDeleteId = null; });
}

// Change the selected filter.
function handleFilterClick(event) {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  updateState(() => { state.filter = button.dataset.filter; });
}

// Turn dark mode on or off and update the toggle button.
function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  const toggle = document.getElementById('theme-toggle');
  toggle.textContent = isDark ? '☀️' : '🌙';
  toggle.setAttribute('aria-pressed', String(isDark));
}

// Flip dark mode and remember the choice.
function handleThemeToggle() {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
  saveTheme(isDark);
}

// Connect all event listeners.
function setupEvents() {
  document.getElementById('task-form').addEventListener('submit', handleAdd);
  taskInput.addEventListener('input', handleTyping);
  list.addEventListener('change', handleListChange);
  list.addEventListener('click', handleListClick);
  list.addEventListener('dblclick', handleListDoubleClick);
  list.addEventListener('keydown', handleListKeydown);
  document.getElementById('filters').addEventListener('click', handleFilterClick);
  document.getElementById('search-input').addEventListener('input', (event) => {
    updateView(() => { state.search = event.target.value; });
  });
  document.getElementById('sort-select').addEventListener('change', (event) => {
    updateState(() => { state.sort = event.target.value; });
  });
  document.getElementById('clear-completed').addEventListener('click', () => {
    updateState(() => { state.tasks = removeCompleted(state.tasks); });
  });
  document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('confirm-cancel').addEventListener('click', cancelDelete);
  document.getElementById('confirm-dialog').addEventListener('close', cancelDelete);
  document.getElementById('theme-toggle').addEventListener('click', handleThemeToggle);
}

// Start the app.
function init() {
  applyTheme(loadTheme());
  setupEvents();
  render(state);
}

init();