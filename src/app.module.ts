// Головний модуль: збирає всі частини застосунку в одне ціле.
// База + три предметні модулі (автори, книги, видачі) + health.
// Його завантажує main.ts і тести (test/app.e2e-spec.ts).
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { requestIdMiddleware } from './common/request-id.middleware';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { LoansModule } from './loans/loans.module';

@Module({
  imports: [DatabaseModule, AuthorsModule, BooksModule, LoansModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  // Middleware з request id працює для всіх маршрутів.
  configure(consumer: MiddlewareConsumer): void {
    // '{*splat}' це синтаксис Express 5 для "усі шляхи" (в Express 4 було просто '*').
    consumer.apply(requestIdMiddleware).forRoutes('{*splat}');
  }
}
