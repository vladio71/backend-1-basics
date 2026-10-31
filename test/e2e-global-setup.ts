// Виконується один раз перед усіма e2e-тестами (globalSetup у jest-e2e.json).
// Створює тестову базу, якщо її ще немає: зʼєднується з службовою базою "postgres"
// і робить CREATE DATABASE. Користувачу з .env потрібне право CREATEDB
// (у Docker-образі postgres користувач library його має, бо він суперкористувач).
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { dbPort, env } from '../src/common/env';
import { testDatabaseName } from './e2e-db';

export default async function globalSetup(): Promise<void> {
  const name = testDatabaseName();
  const admin = new DataSource({
    type: 'postgres',
    host: env('DB_HOST', 'localhost'),
    port: dbPort(),
    username: env('DB_USER', 'library'),
    password: env('DB_PASSWORD', 'library'),
    database: 'postgres',
  });
  await admin.initialize();
  try {
    const rows: unknown[] = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rows.length === 0) {
      // Імʼя бази не можна передати параметром, тому беремо в лапки; testDatabaseName() вже перевірила символи.
      await admin.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await admin.destroy();
  }
}
