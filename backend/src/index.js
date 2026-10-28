require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const exerciseRoutes = require('./routes/exercises');
const sessionRoutes = require('./routes/sessions');
const progressRoutes = require('./routes/progress');
const photoRoutes = require('./routes/photos');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/photos', photoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FitFlow API running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FitFlow API running on http://localhost:${PORT}`);
});
