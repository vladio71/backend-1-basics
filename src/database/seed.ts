// Seed: наповнює порожню базу тестовими даними (3 автори, 8 книг, 2 видачі).
// Окремий скрипт, не частина застосунку. Запуск: npm run seed.
// Якщо автори вже є, нічого не робить, щоб не дублювати дані.
import { Author } from '../authors/author.entity';
import { Book } from '../books/book.entity';
import { Loan } from '../loans/loan.entity';
import { dataSource } from './data-source';

async function seed(): Promise<void> {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const authors = dataSource.getRepository(Author);
  const books = dataSource.getRepository(Book);
  const loans = dataSource.getRepository(Loan);

  const existing = await authors.count();
  if (existing > 0) {
    console.log(`База вже має ${existing} авторів, seed пропущено.`);
    await dataSource.destroy();
    return;
  }

  const [shevchenko, kostenko, zhadan] = await authors.save([
    { name: 'Тарас Шевченко', country: 'Україна' },
    { name: 'Ліна Костенко', country: 'Україна' },
    { name: 'Сергій Жадан', country: 'Україна' },
  ]);

  const saved = await books.save([
    { title: 'Кобзар', year: 1840, authorId: shevchenko.id, copiesTotal: 5, copiesAvailable: 5 },
    { title: 'Гайдамаки', year: 1841, authorId: shevchenko.id, copiesTotal: 2, copiesAvailable: 2 },
    { title: 'Катерина', year: 1838, authorId: shevchenko.id, copiesTotal: 1, copiesAvailable: 1 },
    { title: 'Маруся Чурай', year: 1979, authorId: kostenko.id, copiesTotal: 3, copiesAvailable: 3 },
    { title: 'Записки українського самашедшого', year: 2010, authorId: kostenko.id, copiesTotal: 2, copiesAvailable: 2 },
    { title: 'Ворошиловград', year: 2010, authorId: zhadan.id, copiesTotal: 4, copiesAvailable: 4 },
    { title: 'Інтернат', year: 2017, authorId: zhadan.id, copiesTotal: 2, copiesAvailable: 2 },
    { title: 'Месопотамія', year: 2014, authorId: zhadan.id, copiesTotal: 1, copiesAvailable: 1 },
  ]);

  // Дві видачі: одна активна, одна вже повернута.
  const kobzar = saved[0];
  const internat = saved[6];

  await loans.save([
    { bookId: kobzar.id, readerName: 'Олена Петренко', returnedAt: null },
    { bookId: internat.id, readerName: 'Андрій Коваль', returnedAt: new Date() },
  ]);

  // Активна видача означає, що один примірник "Кобзаря" зараз на руках.
  await books.update(kobzar.id, { copiesAvailable: kobzar.copiesAvailable - 1 });

  console.log('Seed виконано: 3 автори, 8 книг, 2 видачі.');
  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seed не вдався:', error);
  process.exit(1);
});
