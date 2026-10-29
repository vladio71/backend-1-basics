// E2E-тести: піднімаємо весь застосунок і робимо справжні HTTP-запити
// до справжньої PostgreSQL. Перевіряємо весь шлях: контролер, сервіс, репозиторій, база.
// Запуск: npm run test:e2e (потрібна база, налаштування беруться з .env або змінних DB_*).
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';

describe('Бібліотека (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    // Міграції вже виконались при старті (migrationsRun: true). Чистимо таблиці.
    dataSource = app.get(DataSource);
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
});
