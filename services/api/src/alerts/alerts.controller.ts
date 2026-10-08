import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';

const MAX_LIMIT = 100;

const toInt = (value: string | undefined, fallback: number) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  list(
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.alerts.list(
      source || null,
      Math.min(toInt(limit, 20), MAX_LIMIT),
      toInt(offset, 0),
    );
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.get(id);
  }
}
