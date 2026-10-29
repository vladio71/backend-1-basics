// Контролер видач: HTTP-маршрути /loans. Приймає запит, віддає відповідь.
// Жодної логіки: тільки розібрати параметри і передати їх сервісу.
// Викликає його Nest, коли приходить запит. Він викликає loans.service.ts.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponse } from '../common/error-response';
import { Page } from '../common/pagination';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanQuery } from './dto/loan-query.dto';
import { LoanResponse } from './dto/loan-response.dto';
import { LoansService } from './loans.service';

@ApiTags('loans')
@ApiResponse({ status: 400, type: ErrorResponse, description: 'Неправильні дані' })
@ApiResponse({ status: 404, type: ErrorResponse, description: 'Книгу або видачу не знайдено' })
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  // Вхід: ?page=1&pageSize=10&active=true (усе необовʼязкове). Вихід: сторінка видач.
  @Get()
  @ApiOkResponse({ type: Page })
  findPage(@Query() query: LoanQuery): Promise<Page<LoanResponse>> {
    return this.loansService.findPage(query);
  }

  // Вхід: JSON { bookId, readerName }. Вихід: 201 і нова видача, або 409, якщо немає вільних примірників.
  @Post()
  @ApiResponse({ status: 201, type: LoanResponse })
  @ApiResponse({ status: 409, type: ErrorResponse, description: 'Немає вільних примірників' })
  borrow(@Body() dto: CreateLoanDto): Promise<LoanResponse> {
    return this.loansService.borrow(dto);
  }

  // Вхід: id видачі в URL, без тіла. Вихід: 200 і видача з returnedAt, або 409, якщо вже повернули.
  @Post(':id/return')
  @HttpCode(200)
  @ApiOkResponse({ type: LoanResponse })
  @ApiResponse({ status: 409, type: ErrorResponse, description: 'Книгу вже повернули' })
  giveBack(@Param('id', ParseIntPipe) id: number): Promise<LoanResponse> {
    return this.loansService.giveBack(id);
  }
}
