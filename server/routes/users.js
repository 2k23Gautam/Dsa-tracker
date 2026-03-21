const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for profile image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpg, png, webp) are allowed'));
  }
});

// @route   POST /api/users/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image', [auth, upload.single('image')], async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findById(req.user.id);
    user.profileImage = imageUrl;
    await user.save();

    res.json({ message: 'Profile image updated', imageUrl, user });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// @route   GET /api/users/search
// @desc    Search for users by name or email
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id } // Don't show current user
    }).select('name email');

    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/profile/:userId
// @desc    Get public profile stats for a user
// @access  Private
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const problems = await Problem.find({ user: req.params.userId });

    // Aggregate stats similar to StoreContext logic
    const stats = {
      total: problems.length,
      solved: problems.filter(p => p.status === 'Solved' || p.status === 'Revised').length,
      easy: problems.filter(p => p.difficulty === 'Easy').length,
      medium: problems.filter(p => p.difficulty === 'Medium').length,
      hard: problems.filter(p => p.difficulty === 'Hard').length,
    };

    // Aggregate topics for the graph
    const topicMap = {};
    problems.forEach(p => {
      (p.topics || []).forEach(t => {
        if (!topicMap[t]) topicMap[t] = { label: t, solved: 0, revised: 0, needsRevision: 0, others: 0, tracked: 0 };
        topicMap[t].tracked++;
        if (p.status === 'Solved') topicMap[t].solved++;
        else if (p.status === 'Revised') topicMap[t].revised++;
        else if (p.status === 'Needs Revision') topicMap[t].needsRevision++;
        else topicMap[t].others++;
      });
    });

    const topicProgress = Object.values(topicMap)
      .sort((a,b) => b.tracked - a.tracked)
      .slice(0, 10);

    res.json({
      user,
      stats,
      topicProgress
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/friend-request/:userId
// @desc    Send a friend request
// @access  Private
router.post('/friend-request/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.friendRequests.some(r => r.from.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    if (targetUser.friends.some(id => id.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Update target user's requests
    targetUser.friendRequests.push({ from: req.user.id });
    await targetUser.save();

    // Update current user's sent requests
    if (!currentUser.sentRequests.some(id => id.toString() === req.params.userId)) {
      currentUser.sentRequests.push(req.params.userId);
      await currentUser.save();
    }

    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/pending-requests
// @desc    Get pending friend requests
// @access  Private
router.get('/pending-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friendRequests.from', 'name email');
    res.json(user.friendRequests.filter(r => r.status === 'pending'));
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/accept-request/:requestId
// @desc    Accept a friend request
// @access  Private
router.post('/accept-request/:requestId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const request = user.friendRequests.id(req.params.requestId);

    if (!request || request.status !== 'pending') {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'accepted';
    
    // Add to both users' friends lists
    user.friends.push(request.from);
    const sender = await User.findById(request.from);
    if (sender) {
      sender.friends.push(req.user.id);
      // Remove from sender's sentRequests
      sender.sentRequests = (sender.sentRequests || []).filter(id => id.toString() !== req.user.id);
      await sender.save();
    }

    await user.save();
    res.json({ message: 'Friend request accepted', user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/friends
// @desc    Get friend list
// @access  Private
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name email leetcodeUsername leetcodeStats');
    res.json(user.friends);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/remove-friend/:userId
// @desc    Remove a friend
// @access  Private
router.post('/remove-friend/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friendId = req.params.userId;

    if (!user.friends.some(id => id.toString() === friendId)) {
      return res.status(400).json({ message: 'User is not your friend' });
    }

    // Remove from current user
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    await user.save();

    // Remove from target user
    const friend = await User.findById(friendId);
    if (friend) {
      friend.friends = friend.friends.filter(id => id.toString() !== req.user.id);
      await friend.save();
    }

    res.json({ message: 'Friend removed successfully', user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
