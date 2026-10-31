// Глобальний фільтр помилок: ловить будь-який виняток і перетворює
// його на відповідь у форматі ErrorResponse. Один на весь застосунок.
// Підключається в app.setup.ts (через setupApp). Викликає його Nest, коли контролер або сервіс кинув помилку.
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorResponse } from './error-response';
import { getRequestId } from './request-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = getRequestId(request);

    const body = this.toErrorResponse(exception, requestId);

    if (body.statusCode >= 500) {
      // Нашу помилку пишемо в лог з повним стеком. Клієнту стек не віддаємо.
      this.logger.error(`[${requestId}] ${String(exception)}`, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorResponse(exception: unknown, requestId: string): ErrorResponse {
    // Помилки, які ми кинули самі (NotFoundException, ConflictException,
    // BadRequestException від ValidationPipe). Nest знає їх код і текст.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      // Nest кладе в getResponse() або рядок, або обʼєкт { message, error }.
      let message: string | string[] = exception.message;
      let error = statusName(status);
      if (typeof raw === 'object' && raw !== null) {
        const rawObject = raw as { message?: string | string[]; error?: string };
        if (rawObject.message !== undefined) {
          message = rawObject.message;
        }
        if (rawObject.error !== undefined) {
          error = rawObject.error;
        }
      }

      return { statusCode: status, error, message, requestId };
    }

    // Помилка бази "порушено зовнішній ключ" (код 23503 у PostgreSQL). Типово це гонка:
    // сервіс перевірив "книг немає" і дозволив видалити автора, а між перевіркою і DELETE
    // хтось додав книгу. Перевірка в сервісі лишається (вона дає зрозуміле повідомлення
    // у звичайному випадку), а це страховка: конфлікт стану, тобто 409, а не 500.
    if (exception instanceof QueryFailedError && isForeignKeyViolation(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Операцію не виконано: запис повʼязаний з іншими записами (або повʼязаний запис щойно зник). Оновіть дані й спробуйте ще раз',
        requestId,
      };
    }

    // Усе інше (інша помилка бази, баг у коді) стає 500.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Внутрішня помилка сервера',
      requestId,
    };
  }
}

// QueryFailedError несе оригінальну помилку драйвера pg; її поле code містить код SQLSTATE.
function isForeignKeyViolation(error: QueryFailedError): boolean {
  const code = (error.driverError as { code?: string } | undefined)?.code;
  return code === '23503';
}

// 404 -> "Not Found", 409 -> "Conflict". Беремо назву з переліку HttpStatus.
function statusName(status: number): string {
  const key = HttpStatus[status];
  if (key === undefined) {
    return 'Error';
  }
  return key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
