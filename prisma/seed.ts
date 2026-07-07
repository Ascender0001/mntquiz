import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ensure the single config row exists (centered on Palić lake by default).
  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      centerLat: 46.0879,
      centerLng: 19.766,
      radiusMeters: 500,
      passThreshold: 3,
      questionsPerQuiz: 5
    }
  });

  const existing = await prisma.question.count();
  if (existing > 0) {
    console.log(`Questions already present (${existing}); skipping question seed.`);
    return;
  }

  const questions = [
    {
      text: 'On the shore of which lake is this event held?',
      category: 'Geography',
      options: [
        { text: 'Lake Palić', isCorrect: true },
        { text: 'Lake Balaton', isCorrect: false },
        { text: 'Lake Ludaš', isCorrect: false },
        { text: 'Lake Skadar', isCorrect: false }
      ]
    },
    {
      text: 'Palić Lake is located near which city?',
      category: 'Geography',
      options: [
        { text: 'Subotica', isCorrect: true },
        { text: 'Novi Sad', isCorrect: false },
        { text: 'Belgrade', isCorrect: false },
        { text: 'Szeged', isCorrect: false }
      ]
    },
    {
      text: 'In which country is Lake Palić located?',
      category: 'Geography',
      options: [
        { text: 'Serbia', isCorrect: true },
        { text: 'Hungary', isCorrect: false },
        { text: 'Croatia', isCorrect: false },
        { text: 'Romania', isCorrect: false }
      ]
    },
    {
      text: 'Palić is well known for its annual festival dedicated to which art form?',
      category: 'Culture',
      options: [
        { text: 'European Film', isCorrect: true },
        { text: 'Jazz music', isCorrect: false },
        { text: 'Sculpture', isCorrect: false },
        { text: 'Theatre', isCorrect: false }
      ]
    },
    {
      text: 'The historic buildings around Palić were built mainly in which architectural style?',
      category: 'Culture',
      options: [
        { text: 'Art Nouveau (Secession)', isCorrect: true },
        { text: 'Brutalism', isCorrect: false },
        { text: 'Gothic', isCorrect: false },
        { text: 'Baroque', isCorrect: false }
      ]
    }
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.question.create({
      data: {
        text: q.text,
        category: q.category,
        active: true,
        order: i,
        options: {
          create: q.options.map((o, idx) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: idx
          }))
        }
      }
    });
  }

  console.log(`Seeded ${questions.length} questions and default config.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
