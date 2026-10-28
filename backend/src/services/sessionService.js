const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const destroySession = async (userId, token) => {

  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // fallback: +24h

  await prisma.invalidatedToken.upsert({
    where: { token },
    update: {},
    create: { token, expiresAt },
  });

  return { success: true, message: 'Sesiune invalidată cu succes.' };
};


const cleanExpiredTokens = async () => {
  await prisma.invalidatedToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
};

const startWorkoutSession = async ({ workoutId, userId }) => {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw Object.assign(new Error('Antrenamentul nu a fost găsit.'), { code: 'NOT_FOUND' });
  }
  if (workout.type === 'PERSONAL' && workout.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }
  return prisma.workoutSession.create({
    data: { workoutId, userId, status: 'IN_PROGRESS' },
  });
};

const finishWorkoutSession = async ({ sessionId, userId, sets }) => {
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw Object.assign(new Error('Sesiunea nu a fost găsită.'), { code: 'NOT_FOUND' });
  }
  if (session.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }
  if (session.status !== 'IN_PROGRESS') {
    throw Object.assign(
      new Error('Sesiunea nu mai este activă.'),
      { code: 'INVALID_STATUS' }
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.workoutSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', finishedAt: new Date() },
    });

    if (sets && sets.length > 0) {
      await tx.sessionSet.createMany({
        data: sets.map((s) => ({
          sessionId,
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          targetReps: s.targetReps,

          actualReps: s.actualReps != null ? s.actualReps : s.targetReps,
          completedAt: new Date(),
        })),
      });
    }

    return tx.workoutSession.findUnique({
      where: { id: sessionId },
      include: { sets: true },
    });
  });
};

const abandonWorkoutSession = async ({ sessionId, userId }) => {
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw Object.assign(new Error('Sesiunea nu a fost găsită.'), { code: 'NOT_FOUND' });
  }
  if (session.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  if (session.status !== 'IN_PROGRESS') return session;

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: { status: 'ABANDONED', finishedAt: new Date() },
  });
};

module.exports = {
  destroySession,
  cleanExpiredTokens,
  startWorkoutSession,
  finishWorkoutSession,
  abandonWorkoutSession,
};
