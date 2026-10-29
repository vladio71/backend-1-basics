// Параметри GET /loans: пагінація плюс фільтр active=true|false.
// З URL приходить рядок "true" або "false", @Transform робить з нього boolean.
// Використовує loans.controller.ts.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQuery } from '../../common/pagination';

export class LoanQuery extends PaginationQuery {
  @ApiPropertyOptional({ example: true, description: 'true: тільки на руках, false: тільки повернуті' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  active?: boolean;
}
