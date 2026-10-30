// Saving and loading data with localStorage (stored as JSON).
import { FILTERS, SORTS } from './tasks.js';

const DATA_KEY = 'study-planner:v1';
const THEME_KEY = 'study-planner:theme';

// Keep only saved items that look like real tasks.
function cleanTasks(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item) => item && typeof item.id === 'string' && typeof item.text === 'string'
  );
}

// Save tasks, filter and sort order to localStorage.
export function saveData(data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Could not save data:', error);
  }
}

// Load saved data, using safe defaults if nothing valid is stored.
export function loadData() {
  const fallback = { tasks: [], filter: 'all', sort: 'created' };
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY));
    if (!saved) return fallback;
    return {
      tasks: cleanTasks(saved.tasks),
      filter: FILTERS.includes(saved.filter) ? saved.filter : fallback.filter,
      sort: SORTS.includes(saved.sort) ? saved.sort : fallback.sort,
    };
  } catch (error) {
    return fallback;
  }
}

// Remember whether dark mode is on.
export function saveTheme(isDark) {
  try {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  } catch (error) {
    console.error('Could not save theme:', error);
  }
}

// Read the saved theme, or follow the device setting the first time.
export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
  } catch (error) {
    // ignore and fall through to the device setting
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
