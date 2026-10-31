// Параметри GET /books: пагінація плюс фільтри authorId і q (пошук за назвою).
// Усі фільтри необовʼязкові. Приходять рядками з URL, тому є @Type.
// Використовує books.controller.ts.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { PaginationQuery } from '../../common/pagination';

export class BookQuery extends PaginationQuery {
  @ApiPropertyOptional({ example: 1, description: 'Тільки книги цього автора' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId?: number;

  @ApiPropertyOptional({ example: 'кобзар', description: 'Частина назви, без урахування регістру' })
  @IsOptional()
  @IsString()
  // Від 1 до 100 символів: порожній пошук безглуздий, а дуже довгий рядок тільки навантажує базу.
  // Символи % _ \ екранує репозиторій (escapeLike) перед ILIKE.
  @Length(1, 100)
  q?: string;
}
