// Unit-тести фільтра помилок: як різні винятки стають відповідями.
import { ArgumentsHost, ConflictException, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter';

function runFilter(exception: unknown): { status: number; body: { statusCode: number; error: string; message: string } } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'x-request-id': 'test-id' } }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

// Так виглядає помилка бази: QueryFailedError, всередині оригінальна помилка драйвера pg з кодом SQLSTATE.
function dbError(code: string): QueryFailedError {
  return new QueryFailedError('DELETE FROM authors', [], Object.assign(new Error('db error'), { code }));
}

describe('HttpExceptionFilter', () => {
  it('HttpException віддає як є', () => {
    const { status, body } = runFilter(new ConflictException('Книгу вже повернули'));
    expect(status).toBe(409);
    expect(body).toMatchObject({ error: 'Conflict', message: 'Книгу вже повернули' });
  });

  it('порушення зовнішнього ключа (23503) стає 409, а не 500', () => {
    const { status, body } = runFilter(dbError('23503'));
    expect(status).toBe(409);
    expect(body.error).toBe('Conflict');
    expect(body.message).toContain('повʼязаний');
  });

  it('інша помилка бази лишається 500', () => {
    // Фільтр пише 500 у лог; у тесті цей шум не потрібен.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { status, body } = runFilter(dbError('42P01'));
    expect(status).toBe(500);
    expect(body.message).toBe('Внутрішня помилка сервера');
  });
});
