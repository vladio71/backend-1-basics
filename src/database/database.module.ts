// Модуль бази даних: відкриває зʼєднання з PostgreSQL для всього застосунку.
// Бере налаштування з data-source.ts. При старті запускає міграції.
// Імпортує його app.module.ts. Більше ніхто.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      // Застосувати нові міграції при кожному старті. Так Docker-контейнер
      // сам приводить базу до потрібної схеми.
      // Коли так не робити: у production з кількома екземплярами застосунку всі вони
      // стартують одночасно і всі полізуть виконувати ті самі міграції. Там міграції
      // запускають окремим кроком (npm run migration:run) до старту застосунків.
      migrationsRun: true,
    }),
  ],
})
export class DatabaseModule {}
