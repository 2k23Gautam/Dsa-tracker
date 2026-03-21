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
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new problem
router.post('/', auth, async (req, res) => {
  try {
    const problem = new Problem({ ...req.body, user: req.user.id });
    await problem.save();
    const obj = problem.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a problem
router.put('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    const obj = problem.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (err) {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Metadata Suggestion
router.post('/ai-suggest', auth, async (req, res) => {
  try {
    const { name, link, solutionCode } = req.body;
    const input = link || name;
    if (!input) return res.status(400).json({ message: 'Name or link required' });

    const metadata = await suggestProblemMetadata(input, solutionCode);
    res.json(metadata);
  } catch (err) {
    res.status(500).json({ message: err.message || 'AI extraction failed' });
  }
});

module.exports = router;
