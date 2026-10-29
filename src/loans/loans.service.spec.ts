// Unit-тести сервісу видач. Бази даних тут немає: замість репозиторіїв
// підставляємо прості класи з масивами в памʼяті. Перевіряємо тільки правила.
// Запуск: npm test.
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Book } from '../books/book.entity';
import { BooksRepository } from '../books/books.repository';
import { Loan } from './loan.entity';
import { LoansRepository } from './loans.repository';
import { LoansService } from './loans.service';

// Підробка репозиторію книг: тримає книги в масиві.
class FakeBooksRepository {
  books: Book[] = [];

  async findById(id: number): Promise<Book | null> {
    const found = this.books.find((book) => book.id === id);
    return found === undefined ? null : found;
  }
}

// Підробка репозиторію видач: та сама поведінка, що в справжнього, але без SQL.
class FakeLoansRepository {
  loans: Loan[] = [];
  private nextId = 1;

  constructor(private readonly booksRepository: FakeBooksRepository) {}

  async findById(id: number): Promise<Loan | null> {
    const found = this.loans.find((loan) => loan.id === id);
    return found === undefined ? null : found;
  }

  async borrow(bookId: number, readerName: string): Promise<Loan | null> {
    const book = await this.booksRepository.findById(bookId);
    if (book === null || book.copiesAvailable === 0) {
      return null;
    }
    book.copiesAvailable -= 1;
    const loan = new Loan();
    loan.id = this.nextId;
    this.nextId += 1;
    loan.bookId = bookId;
    loan.readerName = readerName;
    loan.borrowedAt = new Date();
    loan.returnedAt = null;
    this.loans.push(loan);
    return loan;
  }

  async giveBack(loan: Loan): Promise<Loan> {
    loan.returnedAt = new Date();
    const book = await this.booksRepository.findById(loan.bookId);
    if (book !== null) {
      book.copiesAvailable += 1;
    }
    return loan;
  }
}

function makeBook(id: number, copiesAvailable: number): Book {
  const book = new Book();
  book.id = id;
  book.title = `Книга ${id}`;
  book.year = 2000;
  book.authorId = 1;
  book.copiesTotal = 3;
  book.copiesAvailable = copiesAvailable;
  book.createdAt = new Date();
  return book;
}

describe('LoansService', () => {
  let service: LoansService;
  let books: FakeBooksRepository;
  let loans: FakeLoansRepository;

  beforeEach(async () => {
    books = new FakeBooksRepository();
    loans = new FakeLoansRepository(books);

    // Nest збирає сервіс так само, як у застосунку, але замість справжніх
    // репозиторіїв (useValue) дає наші підробки.
    const moduleRef = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: BooksRepository, useValue: books },
        { provide: LoansRepository, useValue: loans },
      ],
    }).compile();

    service = moduleRef.get(LoansService);
  });

  describe('borrow', () => {
    it('видає книгу і зменшує кількість вільних примірників', async () => {
      books.books.push(makeBook(1, 2));

      const loan = await service.borrow({ bookId: 1, readerName: 'Олена' });

      expect(loan.bookId).toBe(1);
      expect(loan.readerName).toBe('Олена');
      expect(loan.returnedAt).toBeNull();
      expect(books.books[0].copiesAvailable).toBe(1);
    });

    it('кидає 404, якщо книги немає', async () => {
      await expect(service.borrow({ bookId: 99, readerName: 'Олена' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('кидає 409, якщо вільних примірників немає', async () => {
      books.books.push(makeBook(1, 0));

      await expect(service.borrow({ bookId: 1, readerName: 'Олена' })).rejects.toBeInstanceOf(ConflictException);
      expect(loans.loans).toHaveLength(0);
    });
  });

  describe('giveBack', () => {
    it('повертає книгу і збільшує кількість вільних примірників', async () => {
      books.books.push(makeBook(1, 1));
      const loan = await service.borrow({ bookId: 1, readerName: 'Олена' });

      const returned = await service.giveBack(loan.id);

      expect(returned.returnedAt).not.toBeNull();
      expect(books.books[0].copiesAvailable).toBe(1);
    });

    it('кидає 404, якщо видачі немає', async () => {
      await expect(service.giveBack(42)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('кидає 409, якщо книгу вже повернули', async () => {
      books.books.push(makeBook(1, 1));
      const loan = await service.borrow({ bookId: 1, readerName: 'Олена' });
      await service.giveBack(loan.id);

      await expect(service.giveBack(loan.id)).rejects.toBeInstanceOf(ConflictException);
      // Примірник не має повернутись двічі.
      expect(books.books[0].copiesAvailable).toBe(1);
    });
  });
});
