// Unit-тест middleware: чужий x-request-id приймаємо тільки якщо він безпечний.
import { Request, Response } from 'express';
import { REQUEST_ID_HEADER, requestIdMiddleware } from './request-id.middleware';

function run(incoming: string | undefined): string {
  const req = { headers: {}, header: () => incoming } as unknown as Request;
  const res = { setHeader: jest.fn() } as unknown as Response;
  const next = jest.fn();
  requestIdMiddleware(req, res, next);
  expect(next).toHaveBeenCalled();
  const stored = req.headers[REQUEST_ID_HEADER];
  expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, stored);
  return stored as string;
}

describe('requestIdMiddleware', () => {
  it('залишає нормальний id', () => {
    expect(run('abc-123_XYZ')).toBe('abc-123_XYZ');
  });

  it('генерує id, якщо заголовка немає або він порожній', () => {
    expect(run(undefined)).toMatch(/^[\w-]{36}$/);
    expect(run('')).toMatch(/^[\w-]{36}$/);
  });

  it.each(['has space', 'new\nline', '<script>', 'а-кирилиця', 'x'.repeat(65)])('замінює небезпечний id %j', (bad) => {
    const result = run(bad);
    expect(result).not.toBe(bad);
    expect(result).toMatch(/^[\w-]{1,64}$/);
  });

  it('приймає id рівно в 64 символи', () => {
    const id = 'x'.repeat(64);
    expect(run(id)).toBe(id);
  });
});
