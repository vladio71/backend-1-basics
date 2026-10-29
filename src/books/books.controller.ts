// Контролер книг: HTTP-маршрути /books. Приймає запит, віддає відповідь.
// Жодної логіки: тільки розібрати параметри і передати їх сервісу.
// Викликає його Nest, коли приходить запит. Він викликає books.service.ts.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponse } from '../common/error-response';
import { Page } from '../common/pagination';
import { BooksService } from './books.service';
import { BookQuery } from './dto/book-query.dto';
import { BookResponse } from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('books')
@ApiResponse({ status: 400, type: ErrorResponse, description: 'Неправильні дані' })
@ApiResponse({ status: 404, type: ErrorResponse, description: 'Книгу або автора не знайдено' })
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // Вхід: ?page=1&pageSize=10&authorId=1&q=кобзар (усе необовʼязкове). Вихід: сторінка книг.
  @Get()
  @ApiOkResponse({ type: Page })
  findPage(@Query() query: BookQuery): Promise<Page<BookResponse>> {
    return this.booksService.findPage(query);
  }

  // Вхід: id в URL. Вихід: книга разом з автором, або 404.
  @Get(':id')
  @ApiOkResponse({ type: BookResponse })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BookResponse> {
    return this.booksService.findOne(id);
  }

  // Вхід: JSON { title, year, authorId, copiesTotal }. Вихід: 201 і створена книга.
  @Post()
  @ApiResponse({ status: 201, type: BookResponse })
  create(@Body() dto: CreateBookDto): Promise<BookResponse> {
    return this.booksService.create(dto);
  }

  // Вхід: id в URL і JSON з полями для зміни. Вихід: оновлена книга.
  @Patch(':id')
  @ApiOkResponse({ type: BookResponse })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto): Promise<BookResponse> {
    return this.booksService.update(id, dto);
  }

  // Вхід: id в URL. Вихід: 204 без тіла, або 409, якщо книга має видачі.
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Книгу видалено' })
  @ApiResponse({ status: 409, type: ErrorResponse, description: 'Книга має видачі' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.remove(id);
  }
}
