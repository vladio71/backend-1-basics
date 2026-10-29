// DTO для POST /loans: яку книгу і кому видаємо.
// Використовує loans.controller.ts.
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: 1, description: 'id книги' })
  @IsInt()
  @Min(1)
  bookId: number;

  @ApiProperty({ example: 'Олена Петренко' })
  @IsString()
  @Length(1, 200)
  readerName: string;
}
