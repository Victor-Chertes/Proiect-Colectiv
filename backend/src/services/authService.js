// AuthService – corespunde obiectului «control» AuthService din diagrama UC-1
// Responsabil pentru logica de autentificare, separata de controller

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const findUser = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};


const authenticate = async ({ email, password }) => {

  const user = await findUser(email);

  if (!user) {
    throw new Error('Email sau parolă incorectă.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Email sau parolă incorectă.');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { findUser, authenticate };
