const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://cureconnect.vercel.app', /\.vercel\.app$/],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'CureConnect API is running', timestamp: new Date().toISOString() });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected — CureConnect DB online');
    // Only call app.listen() if we are NOT on Vercel (serverless doesn't need ports)
    if (!process.env.VERCEL) {
      app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 CureConnect API running on port ${process.env.PORT || 5000}`);
      });
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    if (!process.env.VERCEL) {
      app.listen(process.env.PORT || 5000, () => {
        console.log(`⚠️  CureConnect API running on port ${process.env.PORT || 5000} (no DB)`);
      });
    }
  });

module.exports = app;
