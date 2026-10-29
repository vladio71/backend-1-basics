// Репозиторій видач: усі звернення до таблиці "loans" зібрані тут.
// Видача і повернення змінюють дві таблиці (loans і books) в одній транзакції:
// або обидві зміни записуються, або жодна.
// Викликає його тільки сервіс (loans.service.ts).
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { Loan } from './loan.entity';

@Injectable()
export class LoansRepository {
  constructor(
    @InjectRepository(Loan) private readonly loans: Repository<Loan>,
    // DataSource потрібен для транзакцій, бо вони зачіпають кілька таблиць.
    private readonly dataSource: DataSource,
  ) {}

  // active = true: тільки книги на руках (returnedAt IS NULL).
  // active = false: тільки повернуті. undefined: усі.
  async findPage(active: boolean | undefined, skip: number, take: number): Promise<[Loan[], number]> {
    const where: FindOptionsWhere<Loan> = {};
    if (active === true) {
      where.returnedAt = IsNull();
    }
    if (active === false) {
      where.returnedAt = Not(IsNull());
    }
    return this.loans.findAndCount({ where, order: { id: 'ASC' }, skip, take });
  }

  async findById(id: number): Promise<Loan | null> {
    return this.loans.findOneBy({ id });
  }

  // Видати книгу: забрати один вільний примірник і створити запис видачі.
  // Повертає null, якщо вільних примірників не лишилось.
  async borrow(bookId: number, readerName: string): Promise<Loan | null> {
    return this.dataSource.transaction(async (manager) => {
      // Умова copiesAvailable > 0 прямо в UPDATE: якщо два читачі одночасно
      // беруть останній примірник, база віддасть його тільки одному.
      const result = await manager
        .createQueryBuilder()
        .update(Book)
        .set({ copiesAvailable: () => '"copiesAvailable" - 1' })
        .where('id = :bookId AND "copiesAvailable" > 0', { bookId })
        .execute();

      if (result.affected === 0) {
        return null;
      }

      const loan = manager.create(Loan, { bookId, readerName, returnedAt: null });
      return manager.save(loan);
    });
  }

  // Повернути книгу: проставити дату повернення і віддати примірник назад.
  async giveBack(loan: Loan): Promise<Loan> {
    return this.dataSource.transaction(async (manager) => {
      loan.returnedAt = new Date();
      const saved = await manager.save(loan);

      await manager
        .createQueryBuilder()
        .update(Book)
        .set({ copiesAvailable: () => '"copiesAvailable" + 1' })
        .where('id = :bookId', { bookId: loan.bookId })
        .execute();

      return saved;
    });
  }
}
