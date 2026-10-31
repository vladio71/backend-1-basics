// Спільні налаштування застосунку: валідація вхідних даних і формат помилок.
// Винесено в окремий файл, щоб main.ts і e2e-тести налаштовували застосунок однаково.
// Викликають main.ts і test/app.e2e-spec.ts.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';

export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      // Перетворювати тіло запиту на екземпляр DTO-класу (а не на простий обʼєкт).
      // Самі по собі рядки в числа це НЕ перетворює: ?page=2 лишився б рядком "2".
      // Число з нього робить @Type(() => Number) у DTO (див. common/pagination.ts).
      transform: true,
      // Викидати поля, яких немає в DTO. Клієнт не може підсунути зайве.
      // whitelist мовчки відкидає зайве, а forbidNonWhitelisted (тут не ввімкнено) замість цього
      // відповів би 400. Вони важливі, коли DTO цілком передають у базу (create(dto)): без whitelist
      // клієнт міг би записати поле, яке ми не планували давати змінювати.
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
