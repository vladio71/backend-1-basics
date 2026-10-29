// Модуль книг: збирає контролер, сервіс і репозиторій книг.
// Імпортує AuthorsModule, бо сервіс книг перевіряє, що автор існує.
// Імпортують його app.module.ts і loans.module.ts (йому потрібен BooksRepository).
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorsModule } from '../authors/authors.module';
import { Book } from './book.entity';
import { BooksController } from './books.controller';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), AuthorsModule],
  controllers: [BooksController],
  providers: [BooksService, BooksRepository],
  // Експортуємо репозиторій, щоб модуль видач міг змінювати copiesAvailable.
  exports: [BooksRepository],
})
export class BooksModule {}
