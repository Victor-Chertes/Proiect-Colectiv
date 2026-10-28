const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const checkEmail = async (email) => {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return existing !== null;
};

const save = async ({ name, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'USER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

const createAccount = async ({ name, email, password }) => {

  const emailTaken = await checkEmail(email);

  if (emailTaken) {
    throw new Error('Adresa de email este deja folosită. Alege alta sau autentifică-te.');
  }

  const user = await save({ name, email, password });


  return user;
};

module.exports = { checkEmail, save, createAccount };
