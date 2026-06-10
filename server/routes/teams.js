const router = require('express').Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/teams/me — current student's team
router.get('/me', requireAuth, async (req, res) => {
  const team = await Team.findOne({
    $or: [{ leader: req.userId }, { 'members.user': req.userId }],
  }).populate('members.user', 'name email college');
  res.json({ team: team || null });
});

// GET /api/admin/teams — admin: list all teams
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const teams = await Team.find()
    .populate('leader', 'name email')
    .populate('members.user', 'name email college');
  res.json(teams);
});

// POST /api/teams — create a team
router.post('/', requireAuth, async (req, res) => {
  const { name, description, domain, projectTitle } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });

  const existing = await Team.findOne({ name });
  if (existing) return res.status(409).json({ error: 'Team name already taken' });

  const user = await User.findById(req.userId);
  const team = await Team.create({
    name, description: description || '', domain: domain || '', projectTitle: projectTitle || '',
    leader: req.userId,
    leaderName: user.name,
    members: [{ user: req.userId, name: user.name, email: user.email, role: 'leader', status: 'accepted' }],
  });

  await team.populate('members.user', 'name email college');
  res.status(201).json(team);
});

// POST /api/teams/:id/invite — leader invites a member
router.post('/:id/invite', requireAuth, async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  if (team.leader.toString() !== req.userId) return res.status(403).json({ error: 'Only the team leader can invite' });

  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Invitee email is required' });

  const alreadyMember = team.members.some(m => m.email === email);
  if (alreadyMember) return res.status(409).json({ error: 'Already a member or invited' });

  const invitee = await User.findOne({ email });
  team.members.push({
    user: invitee?._id || null,
    name: name || email,
    email,
    role: 'member',
    status: 'pending',
  });
  await team.save();
  await team.populate('members.user', 'name email college');
  res.json(team);
});

// POST /api/teams/:id/join-request — student requests to join
router.post('/:id/join-request', requireAuth, async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const user = await User.findById(req.userId);
  const already = team.members.some(m => m.email === user.email);
  if (already) return res.status(409).json({ error: 'Already a member or invited' });

  team.members.push({
    user: req.userId,
    name: user.name,
    email: user.email,
    role: 'member',
    status: 'pending',
  });
  await team.save();
  await team.populate('members.user', 'name email college');
  res.json(team);
});

// PATCH /api/teams/:id/members/:memberId — leader responds to pending member
router.patch('/:id/members/:memberId', requireAuth, async (req, res) => {
  const { status } = req.body; // 'accepted' | 'rejected'
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  if (team.leader.toString() !== req.userId) return res.status(403).json({ error: 'Only the team leader can manage members' });

  const member = team.members.id(req.params.memberId);
  if (!member) return res.status(404).json({ error: 'Member not found' });

  member.status = status;
  if (status === 'accepted') team.status = 'active';
  await team.save();
  await team.populate('members.user', 'name email college');
  res.json(team);
});

// DELETE /api/teams/:id — delete team (leader only)
router.delete('/:id', requireAuth, async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  if (team.leader.toString() !== req.userId) return res.status(403).json({ error: 'Only the team leader can delete the team' });
  await team.deleteOne();
  res.json({ ok: true });
});

// POST /api/admin/teams/:id/decision — admin approve/reject a team
router.post('/:id/decision', requireAuth, requireAdmin, async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  team.status = action === 'approve' ? 'active' : 'rejected';
  await team.save();
  await team.populate('leader', 'name email');
  await team.populate('members.user', 'name email college');
  res.json(team);
});

module.exports = router;