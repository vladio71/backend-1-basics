// Unit-тести сервісу авторів. Замість бази: підробка репозиторію з масивом.
// Перевіряємо 404 для неіснуючого автора і 409 при видаленні автора з книгами.
// Запуск: npm test.
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Author } from './author.entity';
import { AuthorChanges, AuthorsRepository, NewAuthor } from './authors.repository';
import { AuthorsService } from './authors.service';

class FakeAuthorsRepository {
  authors: Author[] = [];
  // id автора -> скільки книг він "має" у цьому тесті.
  booksByAuthor = new Map<number, number>();
  private nextId = 1;

  async findPage(skip: number, take: number): Promise<[Author[], number]> {
    return [this.authors.slice(skip, skip + take), this.authors.length];
  }

  async findById(id: number): Promise<Author | null> {
    const found = this.authors.find((author) => author.id === id);
    return found === undefined ? null : found;
  }

  async create(data: NewAuthor): Promise<Author> {
    const author = new Author();
    author.id = this.nextId;
    this.nextId += 1;
    author.name = data.name;
    author.country = data.country;
    author.createdAt = new Date();
    this.authors.push(author);
    return author;
  }

  async save(author: Author): Promise<Author> {
    return author;
  }

  async remove(author: Author): Promise<void> {
    this.authors = this.authors.filter((item) => item.id !== author.id);
  }

  async countBooks(authorId: number): Promise<number> {
    return this.booksByAuthor.get(authorId) ?? 0;
  }
}

// Тип використано, щоб файл показував, що саме приймає update.
const changes: AuthorChanges = { country: 'Польща' };

describe('AuthorsService', () => {
  let service: AuthorsService;
  let repository: FakeAuthorsRepository;

  beforeEach(async () => {
    repository = new FakeAuthorsRepository();

    const moduleRef = await Test.createTestingModule({
      providers: [AuthorsService, { provide: AuthorsRepository, useValue: repository }],
    }).compile();

    service = moduleRef.get(AuthorsService);
  });

  it('створює автора і повертає його з id', async () => {
    const created = await service.create({ name: 'Ліна Костенко', country: 'Україна' });

    expect(created.id).toBe(1);
    expect(created.name).toBe('Ліна Костенко');
  });

  it('віддає сторінку з total', async () => {
    await service.create({ name: 'А', country: 'Україна' });
    await service.create({ name: 'Б', country: 'Україна' });
    await service.create({ name: 'В', country: 'Україна' });

    const page = await service.findPage({ page: 2, pageSize: 2 });

    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].name).toBe('В');
  });

  it('оновлює тільки передані поля', async () => {
    const created = await service.create({ name: 'Ліна Костенко', country: 'Україна' });

    const updated = await service.update(created.id, changes);

    expect(updated.name).toBe('Ліна Костенко');
    expect(updated.country).toBe('Польща');
  });

  it('кидає 404, якщо автора немає', async () => {
    await expect(service.findOne(7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('кидає 409 при видаленні автора, в якого є книги', async () => {
    const created = await service.create({ name: 'Сергій Жадан', country: 'Україна' });
    repository.booksByAuthor.set(created.id, 2);

    await expect(service.remove(created.id)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.authors).toHaveLength(1);
  });

  it('видаляє автора без книг', async () => {
    const created = await service.create({ name: 'Сергій Жадан', country: 'Україна' });

    await service.remove(created.id);

    expect(repository.authors).toHaveLength(0);
  });
});
