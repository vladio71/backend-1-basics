// DTO для PATCH /authors/:id: ті самі поля, але всі необовʼязкові.
// Клієнт надсилає тільки те, що хоче змінити.
// Використовує authors.controller.ts.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateAuthorDto {
  @ApiPropertyOptional({ example: 'Ліна Костенко' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({ example: 'Україна' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;
}
