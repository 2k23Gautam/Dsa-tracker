const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Problem = require('../models/Problem');
const { suggestProblemMetadata } = require('../utils/ai');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfallback';

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id: userId }
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
};

// Get all problems for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const problems = await Problem.find({ user: req.user.id }).sort({ createdAt: -1 });
    // Transform _id to id so frontend logic matches completely out of the box
    const formatted = problems.map(p => {
      const obj = p.toObject();
      obj.id = obj._id.toString();
      return obj;
    });
    res.json(formatted);
  } catch (err) {
    console.error('Problem API Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sanitize body: coerce any string-typed fields that accidentally came as arrays
function sanitizeBody(body) {
  const STRING_FIELDS = ['name', 'link', 'platform', 'difficulty', 'status', 'approach',
    'notes', 'solutionCode', 'timeComplexity', 'spaceComplexity',
    'dateSolved', 'revisionDate'];
  const cleaned = { ...body };
  for (const field of STRING_FIELDS) {
    if (Array.isArray(cleaned[field])) {
      cleaned[field] = cleaned[field].join('\n');
    }
  }
  return cleaned;
}

// Add a new problem
router.post('/', auth, async (req, res) => {
  try {
    const body = sanitizeBody(req.body);
    const problem = new Problem({ ...body, user: req.user.id });
    await problem.save();
    const obj = problem.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    console.error('Add Problem Error:', err.name, err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a problem
router.put('/:id', auth, async (req, res) => {
  try {
    const body = sanitizeBody(req.body);
    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    const obj = problem.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    console.error('Update Problem Error:', err.name, err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a problem
router.delete('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json({ message: 'Problem deleted', id: req.params.id });
  } catch (err) {
    console.error('Problem API Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Metadata Suggestion
router.post('/ai-suggest', auth, async (req, res) => {
  try {
    const { name, link, solutionCode } = req.body;
    const input = link || name || 'Unknown Problem';

    if (!solutionCode && !name && !link) {
      return res.status(400).json({ message: 'Provide at least a problem name, link, or solution code.' });
    }

    const metadata = await suggestProblemMetadata(input, solutionCode);
    console.log('[AI Result]', JSON.stringify(metadata, null, 2));
    res.json(metadata);
  } catch (err) {
    console.error('[AI Error]', err.message);
    res.status(500).json({ message: err.message || 'AI extraction failed' });
  }
});

module.exports = router;
