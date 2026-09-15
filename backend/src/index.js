const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Core Middlewares
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Root test route
app.get('/', (req, res) => {
  res.json({
    message: 'CampusHive Backend API is running'
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`Port ${PORT} requires elevated privileges or is reserved by your OS (e.g. Windows port exclusions). Please set PORT=5001 in your backend/.env file.`);
  } else {
    console.error('Server error:', err);
  }
});

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use('/api/v1/auth', require('./routes/authRoutes'));

module.exports = app;
