const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    const users = await User.find({ 'friendRequests.0': { $exists: true } });
    console.log(`Found ${users.length} users with friend requests`);

    users.forEach(u => {
      console.log(`User: ${u.name} (${u.email})`);
      u.friendRequests.forEach(r => {
        console.log(`  - From: ${r.from}, Status: ${r.status}`);
      });
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
