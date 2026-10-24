const router = require('express').Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');

router.post('/register', async (req, res, next) => {
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ email: req.body.email, passwordHash });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) { next(err); }
});
router.post('/login', passport.authenticate('local'), (req, res) => res.json({ email: req.user.email }));
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Sign in required' });
  res.json({ id: req.user.id, email: req.user.email });
});
module.exports = router;