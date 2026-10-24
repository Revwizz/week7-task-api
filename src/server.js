require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const session = require('express-session');
const passport = require('./config/passport');
const taskRoutes = require('./routes/tasks');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }));

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/tasks', taskRoutes);
app.use("/api/auth", require("./routes/auth"));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const sequelize = require('./config/database');
const redis = require('./config/redis');
require('./models/Task');
require('./models/User');

sequelize.sync().then(async () => {
  await redis.connect();
  app.listen(process.env.PORT || 3000, () => console.log('API running'));
});