// DTO відповіді: як виглядає видача в JSON для клієнта.
// Перетворює сервіс (loans.service.ts).
import { ApiProperty } from '@nestjs/swagger';
import { Loan } from '../loan.entity';

export class LoanResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  bookId: number;

  @ApiProperty({ example: 'Олена Петренко' })
  readerName: string;

  @ApiProperty({ example: '2026-10-29T10:00:00.000Z' })
  borrowedAt: Date;

  @ApiProperty({ example: null, nullable: true, description: 'null, поки книга на руках' })
  returnedAt: Date | null;
}

export function toLoanResponse(loan: Loan): LoanResponse {
  return {
    id: loan.id,
    bookId: loan.bookId,
    readerName: loan.readerName,
    borrowedAt: loan.borrowedAt,
    returnedAt: loan.returnedAt,
  };
}
