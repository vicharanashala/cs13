const TASKS_KEY = 'samagama-internship-tasks';

const defaultTasks = [
  {
    id: 'task-faq-project',
    title: 'Complete FAQ Project',
    description: 'Build and submit the FAQ flow for your assigned project milestone.',
    category: 'Project',
    deadline: '2026-06-05',
    priority: 'High',
    attachmentLink: '',
    assignedDate: '2026-06-01',
    status: 'pending',
    slots: [],
    selectedSlot: '',
  },
  {
    id: 'task-upload-noc',
    title: 'Upload NOC',
    description: 'Upload your signed NOC before the deadline so onboarding stays on track.',
    category: 'NOC',
    deadline: '2026-06-10',
    priority: 'High',
    attachmentLink: '',
    assignedDate: '2026-06-01',
    status: 'in-progress',
    slots: [],
    selectedSlot: '',
  },
  {
    id: 'task-select-slot',
    title: 'Select Your Internship Slot',
    description: 'Pick one of the available internship slots directly from this task card.',
    category: 'Internship',
    deadline: '2026-06-03',
    priority: 'Medium',
    attachmentLink: '',
    assignedDate: '2026-06-01',
    status: 'pending',
    slots: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM', '6:00 PM - 8:00 PM'],
    selectedSlot: '',
  },
  {
    id: 'task-github-setup',
    title: 'Complete GitHub Setup',
    description: 'Connect your GitHub account and ensure your repository access is ready.',
    category: 'Setup',
    deadline: '2026-06-04',
    priority: 'Medium',
    attachmentLink: 'https://github.com',
    assignedDate: '2026-06-01',
    status: 'pending',
    slots: [],
    selectedSlot: '',
  },
  {
    id: 'task-orientation',
    title: 'Attend Orientation Meeting',
    description: 'Join the official orientation call and keep the meeting link handy.',
    category: 'Meeting',
    deadline: '2026-06-02',
    priority: 'High',
    attachmentLink: 'https://zoom.us',
    assignedDate: '2026-06-01',
    status: 'pending',
    slots: [],
    selectedSlot: '',
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function emitUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('samagama-tasks-updated'));
}

export function getInternshipTasks() {
  if (typeof window === 'undefined') return defaultTasks;
  const saved = readJson(TASKS_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return saved;
  writeJson(TASKS_KEY, defaultTasks);
  return defaultTasks;
}

export function saveInternshipTasks(tasks) {
  if (typeof window === 'undefined') return;
  writeJson(TASKS_KEY, tasks);
  emitUpdate();
}

export function createInternshipTask(input) {
  const existing = getInternshipTasks();
  const task = {
    id: `task-${Date.now()}`,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category || 'General',
    deadline: input.deadline,
    priority: input.priority || 'Medium',
    attachmentLink: input.attachmentLink?.trim() || '',
    assignedDate: new Date().toISOString().slice(0, 10),
    status: input.status || 'pending',
    slots: Array.isArray(input.slots) ? input.slots.filter(Boolean) : [],
    selectedSlot: '',
  };

  const next = [task, ...existing];
  saveInternshipTasks(next);
  return next;
}

export function updateInternshipTask(taskId, patch) {
  const existing = getInternshipTasks();
  const next = existing.map(task => (
    task.id === taskId
      ? { ...task, ...patch }
      : task
  ));
  saveInternshipTasks(next);
  return next;
}

export function markInternshipTaskCompleted(taskId) {
  return updateInternshipTask(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
}

export function selectInternshipTaskSlot(taskId, slot) {
  return updateInternshipTask(taskId, {
    status: 'completed',
    selectedSlot: slot,
    completedAt: new Date().toISOString(),
  });
}

export function getTaskStatus(task, currentDate = new Date()) {
  if (task.status === 'completed') return 'completed';
  if (task.status === 'missed') return 'missed';
  const deadline = new Date(`${task.deadline}T23:59:59`);
  if (Number.isNaN(deadline.getTime())) return task.status || 'pending';
  if (currentDate > deadline) return 'missed';
  return task.status || 'pending';
}

export function getTaskSummary(tasks = getInternshipTasks()) {
  const currentDate = new Date();
  const summary = { total: tasks.length, pending: 0, completed: 0, missed: 0, inProgress: 0 };

  tasks.forEach(task => {
    const status = getTaskStatus(task, currentDate);
    if (status === 'completed') summary.completed += 1;
    else if (status === 'missed') summary.missed += 1;
    else if (status === 'in-progress') summary.inProgress += 1;
    else summary.pending += 1;
  });

  return summary;
}

export function getTaskDeadlineInfo(task, currentDate = new Date()) {
  const deadline = new Date(`${task.deadline}T23:59:59`);
  if (Number.isNaN(deadline.getTime())) {
    return { label: 'Deadline unavailable', daysRemaining: null };
  }

  const diffDays = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { label: `Missed by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, daysRemaining: diffDays };
  }

  if (diffDays === 0) {
    return { label: 'Due today', daysRemaining: diffDays };
  }

  if (diffDays === 1) {
    return { label: '1 day remaining', daysRemaining: diffDays };
  }

  return { label: `${diffDays} days remaining`, daysRemaining: diffDays };
}

export function formatTaskDate(dateValue) {
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(dateValue));
  } catch {
    return dateValue;
  }
}
