// Middleware: дає кожному запиту унікальний id (заголовок x-request-id).
// Виконується перед контролером для кожного запиту.
// Підключається в app.module.ts. Читає його фільтр помилок.
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId = incoming !== undefined && incoming !== '' ? incoming : randomUUID();

  // Зберігаємо в заголовках запиту, щоб прочитати пізніше у фільтрі.
  req.headers[REQUEST_ID_HEADER] = requestId;
  // Повертаємо клієнту, щоб він міг назвати цей id при зверненні в підтримку.
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export function getRequestId(req: Request): string {
  const value = req.headers[REQUEST_ID_HEADER];
  if (typeof value === 'string') {
    return value;
  }
  return 'unknown';
}
