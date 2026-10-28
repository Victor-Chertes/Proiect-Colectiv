const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getExercises = async () => {
  return prisma.exercise.findMany({
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  });
};

module.exports = { getExercises };
