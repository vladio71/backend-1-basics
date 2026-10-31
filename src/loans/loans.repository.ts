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
      // Про лапки: PostgreSQL перетворює назви без лапок на малі літери, тож copiesAvailable
      // без лапок став би copiesavailable і колонку не знайшов би. Колонки в camelCase завжди в "лапках".
      //
      // Той самий прийом від гонки, що й у giveBack нижче: умова copiesAvailable > 0 стоїть
      // прямо в UPDATE. Якщо два читачі одночасно беруть останній примірник, база віддасть його одному.
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
  // Повертає null, якщо видачі немає або її вже повернули.
  //
  // Урок про гонки (race condition). Наївно було б так: прочитати видачу, перевірити
  // "returnedAt порожній?", а потім записати дату і додати примірник. Між "перевірити" і "оновити"
  // є щілина: два запити одночасно читають returnedAt = null, обидва проходять перевірку,
  // і обидва додають примірник. Книг стає більше, ніж було. Перевірка в JavaScript тут
  // не рятує, бо запити виконуються паралельно і кожен бачить стару картину.
  //
  // Виправлення: зробити перевірку і зміну ОДНОЮ командою SQL:
  //   UPDATE loans SET "returnedAt" = now() WHERE id = $1 AND "returnedAt" IS NULL
  // База обробляє такі UPDATE одного рядка по черзі: другий чекає, поки перший завершиться,
  // потім перечитує рядок, бачить, що returnedAt уже не NULL, і змінює 0 рядків.
  // Кількість змінених рядків (affected) і є відповіддю "я перший?". 0 означає "хтось встиг раніше".
  // Тільки переможець додає примірник; обидві зміни в одній транзакції, тож або обидві, або жодна.
  async giveBack(id: number): Promise<Loan | null> {
    return this.dataSource.transaction(async (manager) => {
      const marked = await manager
        .createQueryBuilder()
        .update(Loan)
        .set({ returnedAt: () => 'now()' })
        .where('id = :id AND "returnedAt" IS NULL', { id })
        .execute();

      if (marked.affected === 0) {
        return null;
      }

      // У межах цієї транзакції вже бачимо свою зміну.
      const loan = await manager.findOneByOrFail(Loan, { id });

      await manager
        .createQueryBuilder()
        .update(Book)
        .set({ copiesAvailable: () => '"copiesAvailable" + 1' })
        .where('id = :bookId', { bookId: loan.bookId })
        .execute();

      return loan;
    });
  }
}
