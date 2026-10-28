const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin user ───────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitflow.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@fitflow.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // ─── Exercise list ────────────────────────────────────────────────────────
  const exercises = [
    { name: 'Bench Press', muscleGroup: 'Chest' },
    { name: 'Incline Bench Press', muscleGroup: 'Chest' },
    { name: 'Push-Up', muscleGroup: 'Chest' },
    { name: 'Cable Fly', muscleGroup: 'Chest' },
    { name: 'Pull-Up', muscleGroup: 'Back' },
    { name: 'Barbell Row', muscleGroup: 'Back' },
    { name: 'Lat Pulldown', muscleGroup: 'Back' },
    { name: 'Seated Cable Row', muscleGroup: 'Back' },
    { name: 'Overhead Press', muscleGroup: 'Shoulders' },
    { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
    { name: 'Front Raise', muscleGroup: 'Shoulders' },
    { name: 'Barbell Curl', muscleGroup: 'Biceps' },
    { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
    { name: 'Hammer Curl', muscleGroup: 'Biceps' },
    { name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
    { name: 'Skull Crusher', muscleGroup: 'Triceps' },
    { name: 'Dips', muscleGroup: 'Triceps' },
    { name: 'Squat', muscleGroup: 'Legs' },
    { name: 'Leg Press', muscleGroup: 'Legs' },
    { name: 'Lunges', muscleGroup: 'Legs' },
    { name: 'Leg Curl', muscleGroup: 'Legs' },
    { name: 'Leg Extension', muscleGroup: 'Legs' },
    { name: 'Calf Raise', muscleGroup: 'Legs' },
    { name: 'Deadlift', muscleGroup: 'Full Body' },
    { name: 'Romanian Deadlift', muscleGroup: 'Full Body' },
    { name: 'Plank', muscleGroup: 'Core' },
    { name: 'Crunch', muscleGroup: 'Core' },
    { name: 'Russian Twist', muscleGroup: 'Core' },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    });
  }
  console.log(`${exercises.length} exercises seeded.`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
