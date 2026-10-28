const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const save = async ({ name, description, restTime, type, userId, exercises }) => {
  return prisma.$transaction(async (tx) => {
    const workout = await tx.workout.create({
      data: {
        name,
        description: description || '',
        restTime: restTime || 60,
        type,
        userId,
      },
    });

    if (exercises && exercises.length > 0) {
      await tx.workoutExercise.createMany({
        data: exercises.map((ex, index) => ({
          workoutId: workout.id,
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          order: index,
        })),
      });
    }

    return tx.workout.findUnique({
      where: { id: workout.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  });
};

const createWorkout = async ({ name, description, restTime, userId, exercises }) => {

  if (!name || !name.trim()) {
    throw new Error('Numele antrenamentului este obligatoriu.');
  }
  if (!exercises || exercises.length === 0) {
    throw new Error('Adaugă cel puțin un exercițiu.');
  }
  for (const ex of exercises) {
    if (!ex.exerciseId || !ex.sets || !ex.reps) {
      throw new Error('Fiecare exercițiu trebuie să aibă număr de serii și repetări.');
    }
  }

  const duplicate = await prisma.workout.findFirst({
    where: { userId, name: name.trim(), type: 'PERSONAL' },
  });
  if (duplicate) {
    throw Object.assign(new Error('Ai deja un antrenament cu acest nume.'), { code: 'DUPLICATE_NAME' });
  }

  return save({ name, description, restTime, type: 'PERSONAL', userId, exercises });
};

const getMyWorkouts = async (userId) => {
  return prisma.workout.findMany({
    where: { userId, type: 'PERSONAL' },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getWorkoutById = async (workoutId, userId) => {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!workout) return null;

  if (workout.type === 'PERSONAL' && workout.userId !== userId) return null;
  return workout;
};

const update = async ({ workoutId, name, description, restTime, exercises }) => {
  return prisma.$transaction(async (tx) => {
    await tx.workout.update({
      where: { id: workoutId },
      data: {
        name,
        description: description || '',
        restTime: restTime || 60,
      },
    });

    await tx.workoutExercise.deleteMany({ where: { workoutId } });

    if (exercises && exercises.length > 0) {
      await tx.workoutExercise.createMany({
        data: exercises.map((ex, index) => ({
          workoutId,
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          order: index,
        })),
      });
    }

    return tx.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  });
};

const updateWorkout = async ({ workoutId, userId, name, description, restTime, exercises }) => {
  const existing = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!existing) {
    throw Object.assign(new Error('Antrenamentul nu mai este disponibil.'), { code: 'NOT_FOUND' });
  }
  if (existing.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  if (!name || !name.trim()) {
    throw new Error('Numele antrenamentului este obligatoriu.');
  }
  if (!exercises || exercises.length === 0) {
    throw new Error('Adaugă cel puțin un exercițiu.');
  }
  for (const ex of exercises) {
    if (!ex.exerciseId || ex.sets < 1 || ex.reps < 1) {
      throw new Error('Fiecare exercițiu trebuie să aibă număr de serii și repetări.');
    }
  }

  const duplicate = await prisma.workout.findFirst({
    where: { userId, name: name.trim(), type: 'PERSONAL', NOT: { id: workoutId } },
  });
  if (duplicate) {
    throw Object.assign(new Error('Ai deja un antrenament cu acest nume.'), { code: 'DUPLICATE_NAME' });
  }

  return update({ workoutId, name, description, restTime, exercises });
};

const deleteById = async (workoutId) => {
  return prisma.$transaction(async (tx) => {
    // Sterge seturile din sesiuni (SessionSet are Cascade pe WorkoutSession, deci le stergem prin sesiuni)
    const sessions = await tx.workoutSession.findMany({ where: { workoutId }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      await tx.sessionSet.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await tx.workoutSession.deleteMany({ where: { workoutId } });
    }
    await tx.workoutExercise.deleteMany({ where: { workoutId } });
    await tx.workout.delete({ where: { id: workoutId } });
  });
};

const deleteWorkout = async (workoutId, userId, role) => {
  const existing = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!existing) {
    throw Object.assign(new Error('Antrenamentul nu a fost găsit.'), { code: 'NOT_FOUND' });
  }
  const isAdmin = role === 'ADMIN';
  if (existing.type === 'PUBLIC' && isAdmin) {
  } else if (existing.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  await deleteById(workoutId);
};

const getPublicWorkouts = async () => {
  return prisma.workout.findMany({
    where: { type: 'PUBLIC' },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createPublicWorkout = async ({ name, description, restTime, adminId, exercises }) => {
  if (!name || !name.trim()) {
    throw new Error('Numele antrenamentului este obligatoriu.');
  }
  if (!exercises || exercises.length === 0) {
    throw new Error('Adaugă cel puțin un exercițiu.');
  }
  for (const ex of exercises) {
    if (!ex.exerciseId || !ex.sets || !ex.reps) {
      throw new Error('Fiecare exercițiu trebuie să aibă număr de serii și repetări.');
    }
  }

  const duplicate = await prisma.workout.findFirst({
    where: { name: name.trim(), type: 'PUBLIC' },
  });
  if (duplicate) {
    throw Object.assign(
      new Error('Există deja un antrenament public cu acest nume.'),
      { code: 'DUPLICATE_NAME' }
    );
  }

  return save({ name, description, restTime, type: 'PUBLIC', userId: adminId, exercises });
};

const copyPublicWorkout = async ({ workoutId, userId }) => {
  const original = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!original) {
    throw Object.assign(new Error('Antrenamentul nu a fost găsit.'), { code: 'NOT_FOUND' });
  }
  if (original.type !== 'PUBLIC') {
    throw Object.assign(new Error('Poți copia doar antrenamente publice.'), { code: 'FORBIDDEN' });
  }

  const duplicate = await prisma.workout.findFirst({
    where: { userId, name: original.name, type: 'PERSONAL' },
  });
  if (duplicate) {
    throw Object.assign(
      new Error('Ai deja un antrenament personal cu același nume.'),
      { code: 'DUPLICATE_NAME' }
    );
  }

  return save({
    name: original.name,
    description: original.description,
    restTime: original.restTime,
    type: 'PERSONAL',
    userId,
    exercises: original.exercises.map((we) => ({
      exerciseId: we.exerciseId,
      sets: we.sets,
      reps: we.reps,
    })),
  });
};

module.exports = {
  save,
  createWorkout,
  getMyWorkouts,
  getWorkoutById,
  update,
  updateWorkout,
  deleteWorkout,
  getPublicWorkouts,
  createPublicWorkout,
  copyPublicWorkout,
};
