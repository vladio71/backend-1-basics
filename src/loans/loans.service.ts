// Сервіс видач: бізнес-правила бібліотеки. Чи можна видати книгу,
// чи можна її повернути. Саме тут живуть 404 і 409 для видач.
// Викликає його контролер. Сам викликає репозиторії видач і книг.
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BooksRepository } from '../books/books.repository';
import { makePage, offsetOf, Page } from '../common/pagination';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanQuery } from './dto/loan-query.dto';
import { LoanResponse, toLoanResponse } from './dto/loan-response.dto';
import { LoansRepository } from './loans.repository';

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepository: LoansRepository,
    private readonly booksRepository: BooksRepository,
  ) {}

  async findPage(query: LoanQuery): Promise<Page<LoanResponse>> {
    const [loans, total] = await this.loansRepository.findPage(query.active, offsetOf(query), query.pageSize);
    return makePage(loans.map(toLoanResponse), total, query);
  }

  async borrow(dto: CreateLoanDto): Promise<LoanResponse> {
    const book = await this.booksRepository.findById(dto.bookId);
    if (book === null) {
      throw new NotFoundException(`Книгу з id=${dto.bookId} не знайдено`);
    }
    if (book.copiesAvailable === 0) {
      // 409: книга існує, але видати її зараз не можна.
      throw new ConflictException('Немає вільних примірників');
    }

    // Репозиторій ще раз перевіряє копії прямо в базі (в одній транзакції).
    // Це захист від двох одночасних запитів на останній примірник.
    const loan = await this.loansRepository.borrow(dto.bookId, dto.readerName);
    if (loan === null) {
      throw new ConflictException('Немає вільних примірників');
    }
    return toLoanResponse(loan);
  }

  async giveBack(id: number): Promise<LoanResponse> {
    const loan = await this.loansRepository.findById(id);
    if (loan === null) {
      throw new NotFoundException(`Видачу з id=${id} не знайдено`);
    }
    if (loan.returnedAt !== null) {
      // 409: видача існує, але книгу вже повернули раніше.
      throw new ConflictException('Книгу вже повернули');
    }

    const returned = await this.loansRepository.giveBack(loan);
    return toLoanResponse(returned);
  }
}
