import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsModule } from './alerts/alerts.module';
import { PrismaModule } from './prisma/prisma.module';

const REQUIRED_ENV = ['DATABASE_URL', 'CORS_ORIGINS'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: (env) => {
        const missing = REQUIRED_ENV.filter((key) => !env[key]);
        if (missing.length) {
          throw new Error(`Missing env variables: ${missing.join(', ')}`);
        }
        return env;
      },
    }),
    PrismaModule,
    AlertsModule,
  ],
})
export class AppModule {}
