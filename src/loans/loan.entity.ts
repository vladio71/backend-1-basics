// Сутність Loan: опис таблиці "loans" (видача книги читачу).
// Поки returnedAt = null, книга на руках. Коли читач повернув, там дата.
// Використовує репозиторій (loans.repository.ts) і міграції.
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Book } from '../books/book.entity';

// Індекси створює міграція AddIndexes; тут вони описані, щоб TypeORM знав про них (migration:generate).
@Index('IDX_loans_bookId', ['bookId'])
@Index('IDX_loans_returnedAt', ['returnedAt'])
@Entity({ name: 'loans' })
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  // Зовнішній ключ: id книги з таблиці "books".
  @Column({ type: 'int' })
  bookId: number;

  // Звʼязок з книгою. У цьому проєкті його не завантажують (JOIN не робимо).
  // Сам зовнішній ключ (FOREIGN KEY) створює міграція Init, її і перевіряє база.
  // Декоратор лише розповідає TypeORM про звʼязок; synchronize вимкнено, тож таблиці він не змінює.
  @ManyToOne(() => Book)
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column({ type: 'varchar', length: 200 })
  readerName: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  borrowedAt: Date;

  // null означає "ще не повернули".
  @Column({ type: 'timestamptz', nullable: true })
  returnedAt: Date | null;
}
