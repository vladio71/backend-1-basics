// Спільні налаштування застосунку: валідація вхідних даних і формат помилок.
// Винесено в окремий файл, щоб main.ts і e2e-тести налаштовували застосунок однаково.
// Викликають main.ts і test/app.e2e-spec.ts.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/http-exception.filter';

export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      // Перетворювати тіло запиту на екземпляр DTO-класу (рядки з URL стають числами).
      transform: true,
      // Викидати поля, яких немає в DTO. Клієнт не може підсунути зайве.
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
