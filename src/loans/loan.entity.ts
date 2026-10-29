// Сутність Loan: опис таблиці "loans" (видача книги читачу).
// Поки returnedAt = null, книга на руках. Коли читач повернув, там дата.
// Використовує репозиторій (loans.repository.ts) і міграції.
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Book } from '../books/book.entity';

@Entity({ name: 'loans' })
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  // Зовнішній ключ: id книги з таблиці "books".
  @Column({ type: 'int' })
  bookId: number;

  // Звʼязок з книгою. У цьому проєкті його не завантажують (JOIN не робимо),
  // але він каже базі: bookId має вказувати на існуючу книгу.
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
