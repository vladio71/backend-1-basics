// Модуль видач: збирає контролер, сервіс і репозиторій видач.
// Імпортує BooksModule, бо видача змінює кількість вільних примірників книги.
// Імпортує його app.module.ts.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from '../books/books.module';
import { Loan } from './loan.entity';
import { LoansController } from './loans.controller';
import { LoansRepository } from './loans.repository';
import { LoansService } from './loans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan]), BooksModule],
  controllers: [LoansController],
  providers: [LoansService, LoansRepository],
})
export class LoansModule {}
