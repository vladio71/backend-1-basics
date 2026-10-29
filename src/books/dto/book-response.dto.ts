// DTO відповіді: як виглядає книга в JSON для клієнта.
// Поле author є тільки в GET /books/:id (там репозиторій робить JOIN).
// Перетворює сервіс (books.service.ts).
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorResponse, toAuthorResponse } from '../../authors/dto/author-response.dto';
import { Book } from '../book.entity';

export class BookResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Кобзар' })
  title: string;

  @ApiProperty({ example: 1840 })
  year: number;

  @ApiProperty({ example: 1 })
  authorId: number;

  @ApiProperty({ example: 5 })
  copiesTotal: number;

  @ApiProperty({ example: 4 })
  copiesAvailable: number;

  @ApiProperty({ example: '2026-10-29T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ type: AuthorResponse, description: 'Тільки в GET /books/:id' })
  author?: AuthorResponse;
}

export function toBookResponse(book: Book): BookResponse {
  const response: BookResponse = {
    id: book.id,
    title: book.title,
    year: book.year,
    authorId: book.authorId,
    copiesTotal: book.copiesTotal,
    copiesAvailable: book.copiesAvailable,
    createdAt: book.createdAt,
  };
  // book.author заповнений тільки тоді, коли репозиторій робив JOIN.
  if (book.author !== undefined && book.author !== null) {
    response.author = toAuthorResponse(book.author);
  }
  return response;
}
