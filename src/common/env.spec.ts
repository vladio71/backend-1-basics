// Unit-тести читання змінних оточення: порожній рядок = не задано, PG_PORT як запасний порт.
import { dbPort, env } from './env';

describe('env', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    delete process.env.PORT;
    delete process.env.DB_PORT;
    delete process.env.PG_PORT;
  });

  afterAll(() => {
    process.env = saved;
  });

  it('порожній рядок вважає незаданим, а не нулем', () => {
    process.env.PORT = '';
    expect(Number(env('PORT', '3000'))).toBe(3000);
  });

  it('віддає значення, якщо воно є', () => {
    process.env.PORT = '4000';
    expect(env('PORT', '3000')).toBe('4000');
  });

  describe('dbPort', () => {
    it('типово 5432', () => {
      expect(dbPort()).toBe(5432);
    });

    it('бере PG_PORT, якщо DB_PORT не задано', () => {
      process.env.PG_PORT = '5433';
      expect(dbPort()).toBe(5433);
    });

    it('бере PG_PORT, якщо DB_PORT дорівнює типовому 5432', () => {
      process.env.DB_PORT = '5432';
      process.env.PG_PORT = '5433';
      expect(dbPort()).toBe(5433);
    });

    it('DB_PORT з нетиповим значенням сильніший за PG_PORT', () => {
      process.env.DB_PORT = '6000';
      process.env.PG_PORT = '5433';
      expect(dbPort()).toBe(6000);
    });

    it('порожній PG_PORT ігнорується', () => {
      process.env.PG_PORT = '';
      expect(dbPort()).toBe(5432);
    });
  });
});
