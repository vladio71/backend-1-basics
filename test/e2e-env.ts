// Виконується перед кожним e2e-файлом (setupFiles у jest-e2e.json), ще до імпорту застосунку.
// Підміняє DB_NAME на тестову базу, щоб data-source.ts підключився саме до неї.
import { testDatabaseName } from './e2e-db';

process.env.DB_NAME = testDatabaseName();
