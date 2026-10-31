// E2E-тести: піднімаємо весь застосунок і робимо справжні HTTP-запити
// до справжньої PostgreSQL. Перевіряємо весь шлях: контролер, сервіс, репозиторій, база.
// Запуск: npm run test:e2e (потрібен запущений PostgreSQL, налаштування беруться з .env або змінних DB_*).
// Тести ЧИСТЯТЬ таблиці (TRUNCATE), тому працюють не з базою з .env, а з окремою тестовою:
// DB_NAME_TEST, типово library_test. Її створює test/e2e-global-setup.ts, якщо немає.
// Назва тестової бази має закінчуватись на _test, інакше тести не стартують.
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { AuthorsRepository } from '../src/authors/authors.repository';
import { BooksRepository } from '../src/books/books.repository';
import { assertTestDatabase } from './e2e-db';

describe('Бібліотека (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    // Міграції вже виконались при старті (migrationsRun: true). Чистимо таблиці,
    // але тільки після перевірки, що підключені до тестової бази, а не до робочої.
    dataSource = app.get(DataSource);
    assertTestDatabase(dataSource.options.database);
    await dataSource.query('TRUNCATE TABLE "loans", "books", "authors" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  // id, які створюються по ходу тестів і використовуються далі.
  let authorId: number;
  let bookId: number;
  let loanId: number;

  it('GET /health відповідає ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('POST /authors створює автора', async () => {
    const res = await request(app.getHttpServer())
      .post('/authors')
      .send({ name: 'Ліна Костенко', country: 'Україна' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Ліна Костенко');
    authorId = res.body.id;
  });

  it('POST /authors з порожнім тілом дає 400 і називає поля', async () => {
    const res = await request(app.getHttpServer()).post('/authors').send({}).expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.requestId).toBeDefined();
    const messages: string[] = res.body.message;
    expect(messages.some((text) => text.includes('name'))).toBe(true);
    expect(messages.some((text) => text.includes('country'))).toBe(true);
  });

  it('GET /authors віддає сторінку', async () => {
    const res = await request(app.getHttpServer()).get('/authors?page=1&pageSize=5').expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(5);
  });

  it('GET /authors/:id дає 404 для неіснуючого', async () => {
    const res = await request(app.getHttpServer()).get('/authors/9999').expect(404);

    expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });

  it('POST /books створює книгу з одним примірником', async () => {
    const res = await request(app.getHttpServer())
      .post('/books')
      .send({ title: 'Маруся Чурай', year: 1979, authorId, copiesTotal: 1 })
      .expect(201);

    expect(res.body.copiesAvailable).toBe(1);
    bookId = res.body.id;
  });

  it('GET /books/:id віддає книгу разом з автором', async () => {
    const res = await request(app.getHttpServer()).get(`/books/${bookId}`).expect(200);

    expect(res.body.title).toBe('Маруся Чурай');
    expect(res.body.author).toMatchObject({ id: authorId, name: 'Ліна Костенко' });
  });

  it('GET /books?q= шукає за частиною назви', async () => {
    const found = await request(app.getHttpServer()).get('/books?q=чурай').expect(200);
    expect(found.body.total).toBe(1);

    const notFound = await request(app.getHttpServer()).get('/books?q=кобзар').expect(200);
    expect(notFound.body.total).toBe(0);
  });

  it('DELETE /authors/:id дає 409, бо в автора є книга', async () => {
    const res = await request(app.getHttpServer()).delete(`/authors/${authorId}`).expect(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('POST /loans видає книгу і зменшує copiesAvailable', async () => {
    const res = await request(app.getHttpServer())
      .post('/loans')
      .send({ bookId, readerName: 'Олена Петренко' })
      .expect(201);

    expect(res.body.returnedAt).toBeNull();
    loanId = res.body.id;

    const book = await request(app.getHttpServer()).get(`/books/${bookId}`).expect(200);
    expect(book.body.copiesAvailable).toBe(0);
  });

  it('POST /loans дає 409, коли вільних примірників немає', async () => {
    const res = await request(app.getHttpServer())
      .post('/loans')
      .send({ bookId, readerName: 'Андрій Коваль' })
      .expect(409);

    expect(res.body.message).toBe('Немає вільних примірників');
  });

  it('GET /loans?active=true показує тільки активні', async () => {
    const active = await request(app.getHttpServer()).get('/loans?active=true').expect(200);
    expect(active.body.total).toBe(1);

    const returned = await request(app.getHttpServer()).get('/loans?active=false').expect(200);
    expect(returned.body.total).toBe(0);
  });

  it('POST /loans/:id/return повертає книгу і збільшує copiesAvailable', async () => {
    const res = await request(app.getHttpServer()).post(`/loans/${loanId}/return`).expect(200);
    expect(res.body.returnedAt).not.toBeNull();

    const book = await request(app.getHttpServer()).get(`/books/${bookId}`).expect(200);
    expect(book.body.copiesAvailable).toBe(1);
  });

  it('POST /loans/:id/return вдруге дає 409', async () => {
    const res = await request(app.getHttpServer()).post(`/loans/${loanId}/return`).expect(409);
    expect(res.body.message).toBe('Книгу вже повернули');
  });

  it('DELETE /books/:id дає 409, бо книга має видачі', async () => {
    await request(app.getHttpServer()).delete(`/books/${bookId}`).expect(409);
  });

  it('PATCH /authors/:id змінює тільки передане поле', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/authors/${authorId}`)
      .send({ country: 'Польща' })
      .expect(200);

    expect(res.body.name).toBe('Ліна Костенко');
    expect(res.body.country).toBe('Польща');
  });

  it('POST /loans/:id/return: 5 паралельних повернень однієї видачі дають рівно одне 200', async () => {
    const author = await request(app.getHttpServer()).post('/authors').send({ name: 'Гонка Повернень', country: 'Україна' }).expect(201);
    const book = await request(app.getHttpServer())
      .post('/books')
      .send({ title: 'Книга для гонки', year: 2000, authorId: author.body.id, copiesTotal: 2 })
      .expect(201);
    const loan = await request(app.getHttpServer())
      .post('/loans')
      .send({ bookId: book.body.id, readerName: 'Гонщик' })
      .expect(201);

    // Усі п'ять запитів стартують разом: кожен бачить "видача ще активна".
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app.getHttpServer()).post(`/loans/${loan.body.id}/return`)),
    );

    const statuses = responses.map((res) => res.status).sort();
    expect(statuses).toEqual([200, 409, 409, 409, 409]);

    // Якби кожне "успішне" повернення додавало примірник, їх стало б більше, ніж є книг.
    const after = await request(app.getHttpServer()).get(`/books/${book.body.id}`).expect(200);
    expect(after.body.copiesAvailable).toBe(after.body.copiesTotal);
  });

  it('DELETE /authors/:id: якщо книга зʼявилась після перевірки, FK дає 409, а не 500', async () => {
    // Імітуємо гонку: перевірка "книг немає" пройшла, а книга в автора вже є.
    const spy = jest.spyOn(app.get(AuthorsRepository), 'countBooks').mockResolvedValue(0);
    try {
      const res = await request(app.getHttpServer()).delete(`/authors/${authorId}`).expect(409);
      expect(res.body).toMatchObject({ statusCode: 409, error: 'Conflict' });
    } finally {
      spy.mockRestore();
    }
  });

  it('DELETE /books/:id: якщо видача зʼявилась після перевірки, FK дає 409, а не 500', async () => {
    const spy = jest.spyOn(app.get(BooksRepository), 'countLoans').mockResolvedValue(0);
    try {
      const res = await request(app.getHttpServer()).delete(`/books/${bookId}`).expect(409);
      expect(res.body).toMatchObject({ statusCode: 409, error: 'Conflict' });
    } finally {
      spy.mockRestore();
    }
  });

  it('GET /books?q= сприймає % і _ як звичайні символи, а не як шаблон', async () => {
    const author = await request(app.getHttpServer()).post('/authors').send({ name: 'Шаблон', country: 'Україна' }).expect(201);
    const make = (title: string) =>
      request(app.getHttpServer()).post('/books').send({ title, year: 2001, authorId: author.body.id, copiesTotal: 1 }).expect(201);
    await make('Знижка 100% гарантії');
    await make('snake_case');

    const percent = await request(app.getHttpServer()).get('/books').query({ q: '%' }).expect(200);
    expect(percent.body.items.map((book: { title: string }) => book.title)).toEqual(['Знижка 100% гарантії']);

    const underscore = await request(app.getHttpServer()).get('/books').query({ q: '_' }).expect(200);
    expect(underscore.body.items.map((book: { title: string }) => book.title)).toEqual(['snake_case']);

    const backslash = await request(app.getHttpServer()).get('/books').query({ q: '\\' }).expect(200);
    expect(backslash.body.total).toBe(0);
  });

  it('GET /books?q= відхиляє порожній і задовгий рядок', async () => {
    await request(app.getHttpServer()).get('/books').query({ q: '' }).expect(400);
    await request(app.getHttpServer()).get('/books').query({ q: 'а'.repeat(101) }).expect(400);
  });

  it('x-request-id: нормальний id повертається як є, підозрілий замінюється', async () => {
    const good = await request(app.getHttpServer()).get('/health').set('x-request-id', 'abc-123_XYZ').expect(200);
    expect(good.headers['x-request-id']).toBe('abc-123_XYZ');

    const bad = await request(app.getHttpServer()).get('/health').set('x-request-id', 'a b<script>').expect(200);
    expect(bad.headers['x-request-id']).not.toBe('a b<script>');
    expect(bad.headers['x-request-id']).toMatch(/^[\w-]{1,64}$/);
  });
});
