// Репозиторій авторів: усі звернення до таблиці "authors" зібрані тут.
// Знає про SQL і TypeORM, не знає про HTTP і бізнес-правила.
// Викликає його тільки сервіс (authors.service.ts).
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { Author } from './author.entity';

// Дані для створення нового автора (без id і createdAt, їх дає база).
export type NewAuthor = {
  name: string;
  country: string;
};

// Що можна змінити в існуючому авторі.
export type AuthorChanges = {
  name?: string;
  country?: string;
};

@Injectable()
export class AuthorsRepository {
  constructor(
    // Готовий TypeORM-репозиторій для таблиці authors. Nest створює його сам.
    @InjectRepository(Author) private readonly authors: Repository<Author>,
  ) {}

  // Повертає сторінку авторів і загальну кількість записів у таблиці.
  async findPage(skip: number, take: number): Promise<[Author[], number]> {
    return this.authors.findAndCount({ order: { id: 'ASC' }, skip, take });
  }

  // null, якщо автора з таким id немає.
  async findById(id: number): Promise<Author | null> {
    return this.authors.findOneBy({ id });
  }

  async create(data: NewAuthor): Promise<Author> {
    const author = this.authors.create(data);
    return this.authors.save(author);
  }

  // Приймає вже змінений обʼєкт і записує його в базу.
  async save(author: Author): Promise<Author> {
    return this.authors.save(author);
  }

  async remove(author: Author): Promise<void> {
    await this.authors.remove(author);
  }

  // Скільки книг посилаються на цього автора. Потрібно перед видаленням.
  // Тут репозиторій авторів читає чужу таблицю books через manager. Це свідомий компроміс:
  // BooksModule уже імпортує AuthorsModule (книга перевіряє автора), тож якби AuthorsModule
  // імпортував BooksModule заради BooksRepository, вийшов би цикл у DI (залежність по колу).
  // Для одного COUNT простіше дозволити собі цей виняток, ніж будувати forwardRef.
  async countBooks(authorId: number): Promise<number> {
    return this.authors.manager.count(Book, { where: { authorId } });
  }
}
