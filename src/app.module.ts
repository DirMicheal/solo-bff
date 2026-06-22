import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from '@/modules/auth/auth.module';
import { GatewayModule } from '@/modules/gateway/gateway.module';
import { AggregatorModule } from '@/modules/aggregator/aggregator.module';
import { MultiEndModule } from '@/modules/multi-end/multi-end.module';
import { PaginationModule } from '@/modules/pagination/pagination.module';
import { CacheModule as CacheServiceModule } from '@/modules/cache/cache.module';
import { BusinessModule } from '@/business/business.module';
import { HealthModule } from '@/health/health.module';
import { RateLimitMiddleware } from '@/common/middleware/rate-limit.middleware';
import { ClientMiddleware } from '@/common/middleware/client.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        ttl: Number(process.env.CACHE_TTL) || 300,
      }),
    }),
    AuthModule,
    GatewayModule,
    AggregatorModule,
    MultiEndModule,
    PaginationModule,
    CacheServiceModule,
    BusinessModule,
    HealthModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClientMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
