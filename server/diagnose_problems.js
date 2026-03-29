require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfallback';

async function diagnose() {
  try {
    console.log('--- Diagnosis Start ---');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    // Simulate the user ID we expect
    // We need a real user ID from the DB to be accurate
    const User = require('./models/User');
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No users found in DB');
      return;
    }
    console.log(`✅ Found test user: ${user.name} (${user._id})`);

    const userId = user._id;
    
    console.log('Testing Problem.find()...');
    const problems = await Problem.find({ user: userId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${problems.length} problems`);

    if (problems.length > 0) {
      console.log('First problem transformation check...');
      const p = problems[0];
      const obj = p.toObject();
      obj.id = obj._id.toString();
      console.log('✅ Transformation successful:', obj.id);
    }

    console.log('--- Diagnosis Success ---');
  } catch (err) {
    console.error('❌ Diagnosis ERROR:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

diagnose();
