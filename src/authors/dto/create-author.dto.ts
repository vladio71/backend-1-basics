// DTO для POST /authors: які поля клієнт має надіслати і які правила для них.
// Декоратори class-validator перевіряють тіло запиту до того, як воно потрапить у сервіс.
// Використовує authors.controller.ts.
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateAuthorDto {
  @ApiProperty({ example: 'Ліна Костенко' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({ example: 'Україна' })
  @IsString()
  @Length(1, 100)
  country: string;
}
