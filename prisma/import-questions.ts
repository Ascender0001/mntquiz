import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Questions from Nyarhangolo_kerdesek_2026.docx — all free-text (typed answers).
const QUESTIONS = [
  'Mit jelent az MNT rövidítés?',
  'Mondj egy települést Vajdaságban, ahol sok magyar él!',
  'Nevezz meg egy magyar nyelvű vajdasági médiumot!',
  'Nevezz meg egy vajdasági magyar fesztivált!',
  'Nevezz meg egy vajdasági magyar színházat!',
  'Mit ünneplünk augusztus 20-án?',
  'Melyik négy fő területtel foglalkozik a Magyar Nemzeti Tanács?',
  'Ki választja meg a Magyar Nemzeti Tanács tagjait?',
  'Milyen gyakran választják meg az MNT-t?',
  'Melyik városban működik a Magyar Tannyelvű Tanítóképző Kar?',
  'Hol működik a Vajdasági Magyar Művelődési Intézet?',
  'Nevezz meg egy vajdasági magyar kulturális intézményt!',
  'Melyik napon emlékezünk az 1848–49-es forradalomra?',
  'Igaz vagy hamis? Az MNT ösztöndíjprogramokat is támogat.',
  'Igaz vagy hamis? Az MNT csak Szabadkán tevékenykedik.',
  'Mikor alakult meg az első Magyar Nemzeti Tanács?',
  'Sorolj fel három vajdasági magyar kulturális rendezvényt!',
  'Melyik MNT-programot ismered vagy hallottál róla?',
  'Ki a Magyar Nemzeti Tanács jelenlegi elnöke?',
  'Melyik városban található a Magyar Nemzeti Tanács székháza?',
  'Nevezz meg egy intézményt, amelynek társalapítója az MNT!',
  'Nevezz meg egy MNT által működtetett vagy támogatott ösztöndíjprogramot!',
  'Mi a SuliExpo?',
  'Mi az EduExpo?',
  'Milyen nyelvi tanfolyamot szervez az MNT középiskolásoknak?',
  'Melyik négy állandó bizottsága van az MNT-nek?',
  'Melyik városban működik a Magyar Médiaház?',
  'Ki választja meg az MNT elnökét?',
  'Milyen célból oszt ki ösztöndíjakat az MNT?',
  'Mikor van a Nemzeti Összetartozás Napja?'
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < QUESTIONS.length; i++) {
    const text = QUESTIONS[i];
    const existing = await prisma.question.findFirst({ where: { text } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.question.create({
      data: { text, type: 'text', category: 'MNT', active: true, order: i }
    });
    created++;
  }

  // Deactivate the seed demo multiple-choice questions so the quiz serves only
  // the imported MNT questions. (Safe to re-run; re-activate from the admin.)
  const deactivated = await prisma.question.updateMany({
    where: { type: 'choice', active: true },
    data: { active: false }
  });

  const activeText = await prisma.question.count({ where: { type: 'text', active: true } });
  console.log(
    `Import: ${created} created, ${skipped} skipped. ` +
      `Deactivated ${deactivated.count} choice question(s). ` +
      `Active text questions now: ${activeText}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
