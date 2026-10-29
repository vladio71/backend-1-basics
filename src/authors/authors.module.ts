// Модуль авторів: збирає контролер, сервіс і репозиторій в одну коробку.
// TypeOrmModule.forFeature([Author]) дає репозиторію доступ до таблиці authors.
// Імпортує його app.module.ts, а також books.module.ts (йому потрібен AuthorsRepository).
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from './author.entity';
import { AuthorsController } from './authors.controller';
import { AuthorsRepository } from './authors.repository';
import { AuthorsService } from './authors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Author])],
  controllers: [AuthorsController],
  providers: [AuthorsService, AuthorsRepository],
  // Експортуємо репозиторій, щоб модуль книг міг перевіряти, чи існує автор.
  exports: [AuthorsRepository],
})
export class AuthorsModule {}
