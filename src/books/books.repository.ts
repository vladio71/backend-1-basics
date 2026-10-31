// Репозиторій книг: усі звернення до таблиці "books" зібрані тут.
// Знає про SQL і TypeORM, не знає про HTTP і бізнес-правила.
// Викликають його сервіси книг і видач (books.service.ts, loans.service.ts).
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { escapeLike } from '../common/escape-like';
import { Loan } from '../loans/loan.entity';
import { Book } from './book.entity';

export type NewBook = {
  title: string;
  year: number;
  authorId: number;
  copiesTotal: number;
  copiesAvailable: number;
};

// Фільтри для списку. Обидва необовʼязкові.
export type BookFilter = {
  authorId?: number;
  titleContains?: string;
};

@Injectable()
export class BooksRepository {
  constructor(@InjectRepository(Book) private readonly books: Repository<Book>) {}

  async findPage(filter: BookFilter, skip: number, take: number): Promise<[Book[], number]> {
    // Умову WHERE збираємо з тих фільтрів, які передали.
    const where: FindOptionsWhere<Book> = {};
    if (filter.authorId !== undefined) {
      where.authorId = filter.authorId;
    }
    if (filter.titleContains !== undefined && filter.titleContains !== '') {
      // ILike: пошук підрядка без урахування регістру. % означає "будь-що".
      // Символи % і _ у самому запиті клієнта екрануємо, інакше ?q=% знайшов би всі книги.
      where.title = ILike(`%${escapeLike(filter.titleContains)}%`);
    }
    return this.books.findAndCount({ where, order: { id: 'ASC' }, skip, take });
  }

  // Книга без автора. Для перевірок і оновлень.
  async findById(id: number): Promise<Book | null> {
    return this.books.findOneBy({ id });
  }

  // Книга разом з автором. Єдиний JOIN у проєкті:
  // SELECT ... FROM books LEFT JOIN authors ON authors.id = books."authorId" WHERE books.id = $1
  async findByIdWithAuthor(id: number): Promise<Book | null> {
    return this.books.findOne({ where: { id }, relations: { author: true } });
  }

  async create(data: NewBook): Promise<Book> {
    const book = this.books.create(data);
    return this.books.save(book);
  }

  async save(book: Book): Promise<Book> {
    return this.books.save(book);
  }

  async remove(book: Book): Promise<void> {
    await this.books.remove(book);
  }

  // Скільки видач посилаються на цю книгу. Потрібно перед видаленням.
  // Тут репозиторій книг читає чужу таблицю loans через manager. Це свідомий компроміс:
  // якби BooksRepository вимагав LoansRepository, BooksModule довелось би імпортувати LoansModule,
  // а LoansModule вже імпортує BooksModule. Вийшов би цикл у DI (залежність по колу), який Nest не любить.
  // Для одного COUNT простіше і чесніше дозволити собі цей виняток, ніж будувати forwardRef.
  async countLoans(bookId: number): Promise<number> {
    return this.books.manager.count(Loan, { where: { bookId } });
  }
}
