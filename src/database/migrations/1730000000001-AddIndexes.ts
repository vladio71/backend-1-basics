// Міграція: індекси для трьох колонок, за якими база шукає найчастіше.
// Без індексу PostgreSQL читає всю таблицю (seq scan). На 8 книгах це непомітно,
// на мільйоні рядків кожен такий запит стає повільним.
// Імена індексів (IDX_...) збігаються з @Index у сутностях, щоб migration:generate не бачив різниці.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1730000000001 implements MigrationInterface {
  name = 'AddIndexes1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Фільтр GET /books?authorId=... і перевірка "чи є в автора книги" перед видаленням.
    await queryRunner.query(`CREATE INDEX "IDX_books_authorId" ON "books" ("authorId")`);

    // PostgreSQL сам НЕ створює індекс на стороні зовнішнього ключа (FK). Без нього
    // кожен пошук видач книги (countLoans, видалення книги) читає всю таблицю loans.
    await queryRunner.query(`CREATE INDEX "IDX_loans_bookId" ON "loans" ("bookId")`);

    // Фільтр GET /loans?active=true|false: "returnedAt IS NULL" це і є "книга на руках".
    await queryRunner.query(`CREATE INDEX "IDX_loans_returnedAt" ON "loans" ("returnedAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_loans_returnedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_loans_bookId"`);
    await queryRunner.query(`DROP INDEX "IDX_books_authorId"`);
  }
}
