// Pure task logic: no DOM code in this file, so it is easy to test.

export const MAX_LENGTH = 100;
export const FILTERS = ['all', 'active', 'completed'];
export const SORTS = ['created', 'priority'];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// Check task text and return an error message, or '' when it is valid.
export function validateText(raw) {
  const text = raw.trim();
  if (text === '') return 'Please type a task first.';
  if (text.length > MAX_LENGTH) {
    return `Task is too long (${text.length}/${MAX_LENGTH} characters).`;
  }
  return '';
}

// Build a new task object.
export function createTask(text, priority) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    done: false,
    priority,
    createdAt: Date.now(),
  };
}

// Flip the done value of one task.
export function toggleTask(tasks, id) {
  const task = tasks.find((item) => item.id === id);
  if (task) task.done = !task.done;
}

// Replace the text of one task with trimmed new text.
export function editTask(tasks, id, newText) {
  const task = tasks.find((item) => item.id === id);
  if (task) task.text = newText.trim();
}

// Return a new array without the task that has this id.
export function removeTask(tasks, id) {
  return tasks.filter((item) => item.id !== id);
}

// Return a new array with only the unfinished tasks.
export function removeCompleted(tasks) {
  return tasks.filter((item) => item.done === false);
}

// Count tasks that are not done yet.
export function countActive(tasks) {
  return tasks.filter((item) => item.done === false).length;
}

// Check whether a task belongs in the selected filter.
function matchesFilter(task, filter) {
  if (filter === 'active') return task.done === false;
  if (filter === 'completed') return task.done === true;
  return true;
}

// Compare two tasks by priority, then by the time they were added.
function byPriority(a, b) {
  const rankA = PRIORITY_ORDER[a.priority] ?? 1;
  const rankB = PRIORITY_ORDER[b.priority] ?? 1;
  return rankA - rankB || a.createdAt - b.createdAt;
}

// Return the tasks to show, using filter, search text and sort order.
export function getVisibleTasks(tasks, filter, search, sort) {
  const query = search.trim().toLowerCase();
  const visible = tasks.filter(
    (task) => matchesFilter(task, filter) && task.text.toLowerCase().includes(query)
  );
  if (sort === 'priority') visible.sort(byPriority);
  return visible;
}
