const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    const today = new Date();
    const history = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        history.push({
            date: d.toLocaleDateString('en-CA'),
            points: 44 + i 
        });
    }

    const result = await User.updateMany(
      {}, 
      { 
        $set: { 
          gdPoints: 50, 
          lastCompletedDate: new Date().toLocaleDateString('en-CA'),
          gdPointHistory: history
        } 
      }
    );
    console.log(`Updated ${result.modifiedCount} users`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
