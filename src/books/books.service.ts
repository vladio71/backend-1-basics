// Сервіс книг: бізнес-правила. Перевіряє, що автор існує, що книгу
// можна видалити, і перетворює сутності на відповіді.
// Викликає його контролер. Сам викликає репозиторії книг і авторів.
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorsRepository } from '../authors/authors.repository';
import { makePage, offsetOf, Page } from '../common/pagination';
import { Book } from './book.entity';
import { BooksRepository } from './books.repository';
import { BookQuery } from './dto/book-query.dto';
import { BookResponse, toBookResponse } from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly authorsRepository: AuthorsRepository,
  ) {}

  async findPage(query: BookQuery): Promise<Page<BookResponse>> {
    const [books, total] = await this.booksRepository.findPage(
      { authorId: query.authorId, titleContains: query.q },
      offsetOf(query),
      query.pageSize,
    );
    return makePage(books.map(toBookResponse), total, query);
  }

  // Єдине місце, де відповідь містить вкладеного автора.
  async findOne(id: number): Promise<BookResponse> {
    const book = await this.booksRepository.findByIdWithAuthor(id);
    if (book === null) {
      throw new NotFoundException(`Книгу з id=${id} не знайдено`);
    }
    return toBookResponse(book);
  }

  async create(dto: CreateBookDto): Promise<BookResponse> {
    await this.ensureAuthorExists(dto.authorId);
    const book = await this.booksRepository.create({
      title: dto.title,
      year: dto.year,
      authorId: dto.authorId,
      copiesTotal: dto.copiesTotal,
      // Нова книга: усі примірники на полиці.
      copiesAvailable: dto.copiesTotal,
    });
    return toBookResponse(book);
  }

  async update(id: number, dto: UpdateBookDto): Promise<BookResponse> {
    const book = await this.getOrFail(id);
    if (dto.title !== undefined) {
      book.title = dto.title;
    }
    if (dto.year !== undefined) {
      book.year = dto.year;
    }
    if (dto.authorId !== undefined) {
      await this.ensureAuthorExists(dto.authorId);
      book.authorId = dto.authorId;
    }
    const saved = await this.booksRepository.save(book);
    return toBookResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const book = await this.getOrFail(id);
    const loansCount = await this.booksRepository.countLoans(id);
    if (loansCount > 0) {
      // 409: книга існує, але має історію видач, її не можна просто стерти.
      throw new ConflictException(`Книга має видачі (${loansCount}), її не можна видалити`);
    }
    await this.booksRepository.remove(book);
  }

  private async getOrFail(id: number): Promise<Book> {
    const book = await this.booksRepository.findById(id);
    if (book === null) {
      throw new NotFoundException(`Книгу з id=${id} не знайдено`);
    }
    return book;
  }

  // Клієнт прислав authorId. Такого автора може не бути: тоді 404.
  private async ensureAuthorExists(authorId: number): Promise<void> {
    const author = await this.authorsRepository.findById(authorId);
    if (author === null) {
      throw new NotFoundException(`Автора з id=${authorId} не знайдено`);
    }
  }
}
