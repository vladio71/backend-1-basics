// Unit-тести сервісу книг. Два підроблені репозиторії: книг і авторів.
// Перевіряємо, що книга створюється з усіма вільними примірниками,
// що неіснуючий автор дає 404, а книга з видачами не видаляється (409).
// Запуск: npm test.
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Author } from '../authors/author.entity';
import { AuthorsRepository } from '../authors/authors.repository';
import { Book } from './book.entity';
import { BookFilter, BooksRepository, NewBook } from './books.repository';
import { BooksService } from './books.service';

class FakeAuthorsRepository {
  authors: Author[] = [];

  async findById(id: number): Promise<Author | null> {
    const found = this.authors.find((author) => author.id === id);
    return found === undefined ? null : found;
  }
}

class FakeBooksRepository {
  books: Book[] = [];
  loansByBook = new Map<number, number>();
  private nextId = 1;

  async findPage(filter: BookFilter, skip: number, take: number): Promise<[Book[], number]> {
    let result = this.books;
    if (filter.authorId !== undefined) {
      result = result.filter((book) => book.authorId === filter.authorId);
    }
    if (filter.titleContains !== undefined) {
      const needle = filter.titleContains.toLowerCase();
      result = result.filter((book) => book.title.toLowerCase().includes(needle));
    }
    return [result.slice(skip, skip + take), result.length];
  }

  async findById(id: number): Promise<Book | null> {
    const found = this.books.find((book) => book.id === id);
    return found === undefined ? null : found;
  }

  async findByIdWithAuthor(id: number): Promise<Book | null> {
    return this.findById(id);
  }

  async create(data: NewBook): Promise<Book> {
    const book = new Book();
    book.id = this.nextId;
    this.nextId += 1;
    book.title = data.title;
    book.year = data.year;
    book.authorId = data.authorId;
    book.copiesTotal = data.copiesTotal;
    book.copiesAvailable = data.copiesAvailable;
    book.createdAt = new Date();
    this.books.push(book);
    return book;
  }

  async save(book: Book): Promise<Book> {
    return book;
  }

  async remove(book: Book): Promise<void> {
    this.books = this.books.filter((item) => item.id !== book.id);
  }

  async countLoans(bookId: number): Promise<number> {
    return this.loansByBook.get(bookId) ?? 0;
  }
}

function makeAuthor(id: number): Author {
  const author = new Author();
  author.id = id;
  author.name = `Автор ${id}`;
  author.country = 'Україна';
  author.createdAt = new Date();
  return author;
}

describe('BooksService', () => {
  let service: BooksService;
  let books: FakeBooksRepository;
  let authors: FakeAuthorsRepository;

  beforeEach(async () => {
    books = new FakeBooksRepository();
    authors = new FakeAuthorsRepository();
    authors.authors.push(makeAuthor(1));

    const moduleRef = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: BooksRepository, useValue: books },
        { provide: AuthorsRepository, useValue: authors },
      ],
    }).compile();

    service = moduleRef.get(BooksService);
  });

  it('створює книгу, усі примірники вільні', async () => {
    const created = await service.create({ title: 'Кобзар', year: 1840, authorId: 1, copiesTotal: 5 });

    expect(created.copiesTotal).toBe(5);
    expect(created.copiesAvailable).toBe(5);
  });

  it('кидає 404, якщо автора з authorId немає', async () => {
    await expect(
      service.create({ title: 'Кобзар', year: 1840, authorId: 99, copiesTotal: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('фільтрує список за частиною назви', async () => {
    await service.create({ title: 'Кобзар', year: 1840, authorId: 1, copiesTotal: 1 });
    await service.create({ title: 'Гайдамаки', year: 1841, authorId: 1, copiesTotal: 1 });

    const page = await service.findPage({ page: 1, pageSize: 10, q: 'коб' });

    expect(page.total).toBe(1);
    expect(page.items[0].title).toBe('Кобзар');
  });

  it('кидає 409 при видаленні книги з видачами', async () => {
    const created = await service.create({ title: 'Кобзар', year: 1840, authorId: 1, copiesTotal: 1 });
    books.loansByBook.set(created.id, 1);

    await expect(service.remove(created.id)).rejects.toBeInstanceOf(ConflictException);
  });
});
