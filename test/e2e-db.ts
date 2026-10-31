// Назва бази для e2e-тестів. Тести роблять TRUNCATE, тому НІКОЛИ не працюють з базою з .env:
// там можуть бути ваші дані для розробки. Беремо DB_NAME_TEST (типово library_test).
import 'dotenv/config';
import { env } from '../src/common/env';

export function testDatabaseName(): string {
  const name = env('DB_NAME_TEST', 'library_test');
  if (!/^[A-Za-z0-9]+(_[A-Za-z0-9]+)*_test$/.test(name)) {
    throw new Error(`E2E-тести відмовляються працювати: назва бази "${name}" має закінчуватись на _test (і містити лише літери, цифри, _).`);
  }
  return name;
}

// Остання лінія захисту: перед TRUNCATE перевіряємо назву бази, з якою реально зʼєднались.
export function assertTestDatabase(name: unknown): void {
  if (typeof name !== 'string' || !name.endsWith('_test')) {
    throw new Error(`E2E-тести відмовляються працювати з базою "${String(name)}": назва має закінчуватись на _test.`);
  }
}
