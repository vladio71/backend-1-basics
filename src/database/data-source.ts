// Налаштування підключення до PostgreSQL. Одне місце для всього проєкту.
// Читає змінні з .env (DB_HOST, DB_PORT, ...).
// Використовують: database.module.ts (застосунок), typeorm CLI (міграції), seed.ts.
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Author } from '../authors/author.entity';
import { Book } from '../books/book.entity';
import { Loan } from '../loans/loan.entity';
import { Init1730000000000 } from './migrations/1730000000000-Init';

function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env('DB_HOST', 'localhost'),
  port: Number(env('DB_PORT', '5432')),
  username: env('DB_USER', 'library'),
  password: env('DB_PASSWORD', 'library'),
  database: env('DB_NAME', 'library'),

  // Список таблиць і список міграцій перелічуємо явно, без масок файлів.
  entities: [Author, Book, Loan],
  migrations: [Init1730000000000],

  // synchronize: false означає, що TypeORM НЕ змінює таблиці сам.
  // Зміни схеми робимо тільки через міграції.
  synchronize: false,
  logging: false,
};

// Цей обʼєкт потрібен typeorm CLI для команд migration:generate і migration:run.
export const dataSource = new DataSource(dataSourceOptions);
