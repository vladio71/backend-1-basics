// Читання змінних оточення. Одне місце для data-source.ts, main.ts і тестів.
// Порожній рядок (PORT=) вважаємо "не задано": Number('') дало б 0, а це не порт.

export function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

const DEFAULT_DB_PORT = '5432';

// Порт, до якого підключається застосунок.
// PG_PORT: порт на хості для Docker (його пише npm run up, коли 5432 зайнятий).
// DB_PORT: порт, до якого підключається застосунок.
// Якщо DB_PORT не задано або дорівнює типовому 5432, а PG_PORT задано, беремо PG_PORT:
// інакше seed, міграції і e2e дивилися б на 5432, а база в Docker слухає інший порт.
export function dbPort(): number {
  const dbPortValue = env('DB_PORT', DEFAULT_DB_PORT);
  const pgPortValue = env('PG_PORT', '');
  if (pgPortValue !== '' && dbPortValue === DEFAULT_DB_PORT) {
    return Number(pgPortValue);
  }
  return Number(dbPortValue);
}
