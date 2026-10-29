// Сутність Book: опис таблиці "books" у базі даних.
// Книга належить автору (authorId). Поле author заповнюється тільки при JOIN.
// Використовує репозиторій (books.repository.ts) і міграції.
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Author } from '../authors/author.entity';

@Entity({ name: 'books' })
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'int' })
  year: number;

  // Зовнішній ключ: id автора з таблиці "authors".
  @Column({ type: 'int' })
  authorId: number;

  // Зв'язок "багато книг до одного автора". Заповнюється тільки
  // коли репозиторій явно просить JOIN (див. findByIdWithAuthor).
  @ManyToOne(() => Author)
  @JoinColumn({ name: 'authorId' })
  author: Author;

  // Скільки примірників книги є в бібліотеці взагалі.
  @Column({ type: 'int' })
  copiesTotal: number;

  // Скільки примірників зараз вільні (не на руках у читачів).
  @Column({ type: 'int' })
  copiesAvailable: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
