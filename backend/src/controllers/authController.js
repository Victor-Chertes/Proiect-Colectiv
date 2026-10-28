const authService = require('../services/authService');
const userService = require('../services/userService');
const sessionService = require('../services/sessionService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email și parola sunt obligatorii.',
      });
    }

    const { token, user } = await authService.authenticate({ email, password });

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Numele, emailul și parola sunt obligatorii.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Parola trebuie să aibă cel puțin 6 caractere.',
      });
    }

    const user = await userService.createAccount({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Cont creat cu succes! Te poți autentifica acum.',
      user,
    });
  } catch (err) {
    const status = err.message.includes('deja folosită') ? 409 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    const result = await sessionService.destroySession(req.user.id, token);

    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Eroare la deconectare.' });
  }
};

module.exports = { register, login, logout, getMe };
