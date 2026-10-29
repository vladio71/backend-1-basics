// Сутність Author: опис таблиці "authors" у базі даних.
// Кожне поле класу = колонка в таблиці. TypeORM читає ці декоратори.
// Використовує репозиторій (authors.repository.ts) і міграції.
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'authors' })
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
