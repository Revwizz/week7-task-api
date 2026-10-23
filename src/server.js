require('dotenv').config();
const express = require('express');
const taskRoutes = require('./routes/tasks');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.use('/api/tasks', taskRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
const sequelize = require('./config/database');
require('./models/Task');

sequelize.sync().then(() => {
  app.listen(process.env.PORT || 3000, () => console.log('API running'));
});