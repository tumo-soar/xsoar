import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AlertRow = {
  alert_id: string;
  number: bigint;
  source: string;
  labels: Record<string, string>;
  filename: string | null;
  status: string;
  report: unknown;
  error: string | null;
  received_at: Date;
  updated_at: Date;
};

export type Alert = Omit<AlertRow, 'alert_id' | 'number'> & {
  id: string;
  number: number;
};

const toAlert = ({ alert_id, number, ...rest }: AlertRow): Alert => ({
  id: alert_id,
  number: Number(number),
  ...rest,
});

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(source: string | null, limit: number, offset: number) {
    const rows = await this.prisma.$queryRaw<AlertRow[]>`
      SELECT * FROM orchestrator.api_alerts
      WHERE (${source}::text IS NULL OR source = ${source})
      ORDER BY received_at DESC, number DESC
      LIMIT ${limit} OFFSET ${offset}`;
    const [{ count }] = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count FROM orchestrator.api_alerts
      WHERE (${source}::text IS NULL OR source = ${source})`;
    return { data: rows.map(toAlert), total: Number(count) };
  }

  async get(id: string) {
    const rows = await this.prisma.$queryRaw<AlertRow[]>`
      SELECT * FROM orchestrator.api_alerts WHERE alert_id = ${id}::uuid`;
    if (rows.length === 0) {
      throw new NotFoundException('alert not found');
    }
    return toAlert(rows[0]);
  }
}
