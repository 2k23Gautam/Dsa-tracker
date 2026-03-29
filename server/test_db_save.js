require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  try {
    const user = await User.findOne();
    if (!user) {
      console.log('No user found');
      return;
    }
    console.log('User id:', user._id);
    
    // Test the add problem payload
    const body = {
      name: 'Test Problem',
      link: '',
      platform: 'LeetCode',
      difficulty: 'Easy',
      status: 'Solved',
      topics: ['Array'],
      patterns: [],
      dateSolved: '2023-10-10',
      revisionCount: 0
    };
    
    // Simulate sanitizeBody
    const STRING_FIELDS = ['name', 'link', 'platform', 'difficulty', 'status', 'approach',
      'notes', 'solutionCode', 'timeComplexity', 'spaceComplexity', 'visualization',
      'dateSolved', 'revisionDate'];
    const cleaned = { ...body };
    for (const field of STRING_FIELDS) {
      if (Array.isArray(cleaned[field])) {
        cleaned[field] = cleaned[field].join('\n');
      }
    }
    
    const problem = new Problem({ ...cleaned, user: user._id });
    await problem.save();
    console.log('Saved Problem:', problem._id);
    
    // now cleanup
    await Problem.findByIdAndDelete(problem._id);
  } catch (err) {
    console.error('Validation Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

run();
