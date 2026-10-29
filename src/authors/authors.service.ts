// Сервіс авторів: бізнес-правила. Вирішує, що можна, а що ні
// (наприклад, не можна видалити автора, в якого ще є книги).
// Викликає його контролер. Сам викликає тільки репозиторій.
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { makePage, offsetOf, Page, PaginationQuery } from '../common/pagination';
import { AuthorsRepository } from './authors.repository';
import { AuthorResponse, toAuthorResponse } from './dto/author-response.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Author } from './author.entity';

@Injectable()
export class AuthorsService {
  constructor(private readonly authorsRepository: AuthorsRepository) {}

  async findPage(query: PaginationQuery): Promise<Page<AuthorResponse>> {
    const [authors, total] = await this.authorsRepository.findPage(offsetOf(query), query.pageSize);
    return makePage(authors.map(toAuthorResponse), total, query);
  }

  async findOne(id: number): Promise<AuthorResponse> {
    const author = await this.getOrFail(id);
    return toAuthorResponse(author);
  }

  async create(dto: CreateAuthorDto): Promise<AuthorResponse> {
    const author = await this.authorsRepository.create({ name: dto.name, country: dto.country });
    return toAuthorResponse(author);
  }

  async update(id: number, dto: UpdateAuthorDto): Promise<AuthorResponse> {
    const author = await this.getOrFail(id);
    if (dto.name !== undefined) {
      author.name = dto.name;
    }
    if (dto.country !== undefined) {
      author.country = dto.country;
    }
    const saved = await this.authorsRepository.save(author);
    return toAuthorResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const author = await this.getOrFail(id);
    const booksCount = await this.authorsRepository.countBooks(id);
    if (booksCount > 0) {
      // 409: автор існує, але видалити його зараз не можна.
      throw new ConflictException(`В автора ще є книги (${booksCount}), спочатку видаліть їх`);
    }
    await this.authorsRepository.remove(author);
  }

  // Спільна перевірка "запис існує". 404, якщо ні.
  private async getOrFail(id: number): Promise<Author> {
    const author = await this.authorsRepository.findById(id);
    if (author === null) {
      throw new NotFoundException(`Автора з id=${id} не знайдено`);
    }
    return author;
  }
}
