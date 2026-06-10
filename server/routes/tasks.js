const router = require('express').Router();
const { Task, TaskSubmission } = require('../models/Task');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/tasks — all task definitions
router.get('/', async (req, res) => {
  const { phase } = req.query;
  const filter = phase && phase !== 'all' ? { phase } : {};
  const tasks = await Task.find(filter).sort({ phase: 1, order: 1 });
  res.json(tasks);
});

// GET /api/tasks/my — current student's task statuses
router.get('/my', requireAuth, async (req, res) => {
  const submissions = await TaskSubmission.find({ student: req.userId }).populate('task');
  const tasks = await Task.find().sort({ phase: 1, order: 1 });

  // Merge: attach submission status to each task
  const subMap = Object.fromEntries(submissions.map(s => [s.task._id.toString(), s]));
  const result = tasks.map(task => ({
    ...task.toObject(),
    myStatus: subMap[task._id.toString()]?.status || 'locked',
    myGrade: subMap[task._id.toString()]?.grade || 'none',
  }));

  res.json(result);
});

// POST /api/tasks — admin: create task
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { taskId, title, description, phase, spReward, deadline, isOptional, order } = req.body;
  if (!taskId || !title || !phase) return res.status(400).json({ error: 'taskId, title, phase required' });

  const task = await Task.create({ taskId, title, description: description || '', phase, spReward: spReward || 10, deadline: deadline || '', isOptional: isOptional || false, order: order || 0 });
  res.status(201).json(task);
});

// PUT /api/tasks — admin: bulk replace tasks
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  const tasks = Array.isArray(req.body) ? req.body : [];
  await Task.deleteMany({});
  if (tasks.length) {
    const phases = ['bronze', 'silver', 'gold', 'platinum'];
    await Task.insertMany(tasks.map((t, i) => ({
      taskId: t.taskId || t.id || `${phases[i % 4].toUpperCase()[0]}${i + 1}`,
      title: t.title,
      description: t.description || '',
      phase: t.phase || 'bronze',
      spReward: t.spReward || 10,
      deadline: t.deadline || '',
      isOptional: t.isOptional || false,
      order: t.order || i,
    })));
  }
  const all = await Task.find().sort({ phase: 1, order: 1 });
  res.json(all);
});

// PATCH /api/tasks/:id/submit — student submits a task
router.patch('/:id/submit', requireAuth, async (req, res) => {
  let submission = await TaskSubmission.findOne({ task: req.params.id, student: req.userId });
  if (!submission) {
    submission = await TaskSubmission.create({ task: req.params.id, student: req.userId, status: 'submitted', submittedAt: new Date() });
  } else {
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    await submission.save();
  }
  await submission.populate('task');
  res.json(submission);
});

// PATCH /api/tasks/submissions/:submissionId/grade — admin grades
router.patch('/submissions/:submissionId/grade', requireAuth, requireAdmin, async (req, res) => {
  const { grade, feedback } = req.body;
  if (!['pass', 'fail', 'partial'].includes(grade)) return res.status(400).json({ error: 'Invalid grade' });

  const submission = await TaskSubmission.findById(req.params.submissionId);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });

  submission.grade = grade;
  submission.feedback = feedback || '';
  submission.status = 'graded';
  submission.gradedAt = new Date();
  submission.gradedBy = req.userId;
  await submission.save();
  await submission.populate('task');
  await submission.populate('gradedBy', 'name');
  res.json(submission);
});

module.exports = router;