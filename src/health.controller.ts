// Контролер GET /health: відповідає "ok", якщо застосунок живий і база відповідає.
// Його опитують Docker (healthcheck) і люди, щоб переконатись, що все піднялось.
// Підключений у app.module.ts.
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

export class HealthResponse {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'ok' })
  database: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  // Вхід: нічого. Вихід: { status: "ok", database: "ok" }. Якщо база мовчить, буде 500.
  @Get()
  @ApiOkResponse({ type: HealthResponse })
  async check(): Promise<HealthResponse> {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', database: 'ok' };
  }
}
