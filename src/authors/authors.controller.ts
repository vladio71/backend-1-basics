// Контролер авторів: HTTP-маршрути /authors. Приймає запит, віддає відповідь.
// Жодної логіки: тільки розібрати параметри і передати їх сервісу.
// Викликає його Nest, коли приходить запит. Він викликає authors.service.ts.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponse } from '../common/error-response';
import { Page, PaginationQuery } from '../common/pagination';
import { AuthorsService } from './authors.service';
import { AuthorResponse } from './dto/author-response.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@ApiTags('authors')
@ApiResponse({ status: 400, type: ErrorResponse, description: 'Неправильні дані' })
@ApiResponse({ status: 404, type: ErrorResponse, description: 'Автора не знайдено' })
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  // Вхід: ?page=1&pageSize=10. Вихід: сторінка авторів { items, total, page, pageSize }.
  @Get()
  @ApiOkResponse({ type: Page })
  findPage(@Query() query: PaginationQuery): Promise<Page<AuthorResponse>> {
    return this.authorsService.findPage(query);
  }

  // Вхід: id в URL. Вихід: один автор або 404.
  @Get(':id')
  @ApiOkResponse({ type: AuthorResponse })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuthorResponse> {
    return this.authorsService.findOne(id);
  }

  // Вхід: JSON { name, country }. Вихід: 201 і створений автор з id.
  @Post()
  @ApiResponse({ status: 201, type: AuthorResponse })
  create(@Body() dto: CreateAuthorDto): Promise<AuthorResponse> {
    return this.authorsService.create(dto);
  }

  // Вхід: id в URL і JSON з полями, які треба змінити. Вихід: оновлений автор.
  @Patch(':id')
  @ApiOkResponse({ type: AuthorResponse })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAuthorDto): Promise<AuthorResponse> {
    return this.authorsService.update(id, dto);
  }

  // Вхід: id в URL. Вихід: 204 без тіла, або 409, якщо в автора ще є книги.
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Автора видалено' })
  @ApiResponse({ status: 409, type: ErrorResponse, description: 'В автора ще є книги' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.authorsService.remove(id);
  }
}
