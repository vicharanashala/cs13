const mongoose = require('mongoose');

// Internship task definition (template, not per-student)
const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  phase: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], required: true },
  spReward: { type: Number, default: 10 },
  deadline: { type: String, default: '' },
  isOptional: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// Per-student task submission/status
const taskSubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  status: { type: String, enum: ['locked', 'todo', 'in_progress', 'submitted', 'graded'], default: 'locked' },
  submittedAt: { type: Date, default: null },
  grade: { type: String, enum: ['none', 'pass', 'fail', 'partial'], default: 'none' },
  gradedAt: { type: Date, default: null },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  feedback: { type: String, default: '' },
}, { timestamps: true });

const TaskSubmission = mongoose.model('TaskSubmission', taskSubmissionSchema);

module.exports = { Task, TaskSubmission };