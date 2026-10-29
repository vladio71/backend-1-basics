// DTO відповіді: як виглядає автор у JSON, який отримує клієнт.
// Сутність (таблиця) і відповідь розділені навмисно: таблицю можна міняти,
// а формат відповіді лишати стабільним. Перетворює сервіс (authors.service.ts).
import { ApiProperty } from '@nestjs/swagger';
import { Author } from '../author.entity';

export class AuthorResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ліна Костенко' })
  name: string;

  @ApiProperty({ example: 'Україна' })
  country: string;

  @ApiProperty({ example: '2026-10-29T10:00:00.000Z' })
  createdAt: Date;
}

export function toAuthorResponse(author: Author): AuthorResponse {
  return {
    id: author.id,
    name: author.name,
    country: author.country,
    createdAt: author.createdAt,
  };
}
