// DTO для PATCH /books/:id: назва, рік, автор. Усе необовʼязкове.
// Кількість примірників тут не міняємо, нею керують видачі (loans).
// Використовує books.controller.ts.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Маруся Чурай' })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  title?: string;

  @ApiPropertyOptional({ example: 1979 })
  @IsOptional()
  @IsInt()
  @Min(0)
  year?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  authorId?: number;
}
