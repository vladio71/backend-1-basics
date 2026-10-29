// DTO для POST /books: поля нової книги і правила перевірки.
// copiesAvailable клієнт не надсилає: нова книга має всі примірники вільними.
// Використовує books.controller.ts.
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'Маруся Чурай' })
  @IsString()
  @Length(1, 300)
  title: string;

  @ApiProperty({ example: 1979 })
  @IsInt()
  @Min(0)
  year: number;

  @ApiProperty({ example: 2, description: 'id існуючого автора' })
  @IsInt()
  @Min(1)
  authorId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  copiesTotal: number;
}
