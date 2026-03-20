const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/platforms/stats/:platform/:handle
// @desc    Fetch user stats from a specific platform
// @access  Private
router.get('/stats/:platform/:handle', auth, async (req, res) => {
  const { platform, handle } = req.params;
  
  try {
    let stats = null;

    if (platform === 'leetcode') {
       // Handled by leetcode.js for detailed stats, but this syncs the handle
       const user = await User.findById(req.user.id);
       if (user) {
         user.leetcodeUsername = handle;
         await user.save();
         stats = { handle, platform: 'leetcode' };
       }
    }

    if (!stats) {
      return res.status(404).json({ message: 'Platform not supported' });
    }

    return res.json(stats);
  } catch (err) {
    console.error(`Error syncing ${platform}:`, err.message);
    return res.status(500).json({ message: 'Failed to sync platform' });
  }
});

// @route   POST /api/platforms/sync-all
// @desc    Sync LeetCode handle for current user
// @access  Private
router.post('/sync-all', auth, async (req, res) => {
  const { leetcode } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (leetcode !== undefined) {
      user.leetcodeUsername = leetcode;
    }

    await user.save();
    return res.json({ message: 'Handles updated successfully', user });
  } catch (err) {
    console.error('Sync all error:', err.message);
    return res.status(500).send('Server Error');
  }
});

// @route   GET /api/platforms/contests
// @desc    Fetch upcoming contests for the next 48 hours
// @access  Private
router.get('/contests', auth, async (req, res) => {
  try {
    const now = Date.now();
    const mockContests = [
      {
        id: 'lc-weekly',
        platform: 'LeetCode',
        name: 'Weekly Contest',
        startTime: now + (24 * 60 * 60 * 1000),
        duration: 5400,
        link: 'https://leetcode.com/contest/'
      },
      {
        id: 'lc-biweekly',
        platform: 'LeetCode',
        name: 'Biweekly Contest',
        startTime: now + (36 * 60 * 60 * 1000),
        duration: 5400,
        link: 'https://leetcode.com/contest/'
      }
    ];

    const allContests = mockContests
      .filter(c => c.startTime > now && c.startTime < now + (48 * 60 * 60 * 1000))
      .sort((a, b) => a.startTime - b.startTime);

    return res.json(allContests);
  } catch (err) {
    console.error('Contest fetch error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch contests' });
  }
});

module.exports = router;
