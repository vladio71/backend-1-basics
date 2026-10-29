// Пагінація: що клієнт надсилає (page, pageSize) і що отримує (сторінка).
// Спільне для всіх списків: /authors, /books, /loans.
// Використовують контролери (query) і сервіси (відповідь).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Параметри запиту. Приходять як рядки з URL (?page=2&pageSize=10),
// тому @Type(() => Number) перетворює їх на числа перед перевіркою.
export class PaginationQuery {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}

// Відповідь зі списком. T це тип одного елемента (AuthorResponse, BookResponse...).
export class Page<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ example: 42, description: 'Скільки записів є всього, не тільки на цій сторінці' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;
}

// Збирає відповідь Page з уже готових елементів і загальної кількості.
export function makePage<T>(items: T[], total: number, query: PaginationQuery): Page<T> {
  return { items, total, page: query.page, pageSize: query.pageSize };
}

// Скільки записів пропустити в базі, щоб дістати потрібну сторінку.
// page=1 -> 0, page=2 при pageSize=10 -> 10.
export function offsetOf(query: PaginationQuery): number {
  return (query.page - 1) * query.pageSize;
}
