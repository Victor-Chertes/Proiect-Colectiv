const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token de autentificare lipsă' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const invalidated = await prisma.invalidatedToken.findUnique({ where: { token } });
    if (invalidated) {
      return res.status(401).json({ success: false, message: 'Sesiunea a fost închisă. Autentifică-te din nou.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Sesiunea a expirat. Autentifică-te din nou.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Sesiunea a expirat. Autentifică-te din nou.' });
    }
    return res.status(401).json({ success: false, message: 'Token invalid.' });
  }
};

module.exports = auth;
