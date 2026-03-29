require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  try {
    const admin = mongoose.connection.db.admin();
    const list = await admin.listDatabases();
    fs.writeFileSync('dbs.txt', JSON.stringify(list.databases.map(d => d.name), null, 2));
  } catch (err) {
    fs.writeFileSync('dbs.txt', 'Error: ' + err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();
