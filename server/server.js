require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/users', require('./routes/users'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/leetcode', require('./routes/leetcode'));

// Serve uploaded profile images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.get('/api/test', (req, res) => res.json({ message: 'API is working' }));

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Atlas Connected'))
    .catch(err => console.log('MongoDB Connection Error: ', err));
} else {
  console.log('Provide MONGO_URI in .env to connect to the database.');
}

const PORT = process.env.PORT || 5000;

// Update to serve frontend in production
const distPath = path.join(__dirname, '../dist');

// Serve static files from the Vite build directory
app.use(express.static(distPath));

// Handle React routing, return all requests to React app (except API)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
