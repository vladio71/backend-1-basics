// Міграція: перша версія схеми бази. Створює таблиці authors, books, loans.
// up() застосовує зміни, down() відкочує їх назад.
// Запускається автоматично при старті застосунку і командою npm run migration:run.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1730000000000 implements MigrationInterface {
  name = 'Init1730000000000';

  // Імена зовнішніх ключів (FK_...) такі, які TypeORM генерує сам.
  // Завдяки цьому npm run migration:generate не бачить різниці між сутностями і базою.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "authors" (
        "id"        SERIAL PRIMARY KEY,
        "name"      VARCHAR(200) NOT NULL,
        "country"   VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "books" (
        "id"              SERIAL PRIMARY KEY,
        "title"           VARCHAR(300) NOT NULL,
        "year"            INT NOT NULL,
        "authorId"        INT NOT NULL,
        "copiesTotal"     INT NOT NULL,
        "copiesAvailable" INT NOT NULL,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_54f49efe2dd4d2850e736e9ab86" FOREIGN KEY ("authorId") REFERENCES "authors"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "loans" (
        "id"         SERIAL PRIMARY KEY,
        "bookId"     INT NOT NULL,
        "readerName" VARCHAR(200) NOT NULL,
        "borrowedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "returnedAt" TIMESTAMPTZ NULL,
        CONSTRAINT "FK_aad54a9134e293d4d3be70db995" FOREIGN KEY ("bookId") REFERENCES "books"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Видаляємо у зворотному порядку, бо loans посилається на books, а books на authors.
    await queryRunner.query(`DROP TABLE "loans"`);
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TABLE "authors"`);
  }
}
