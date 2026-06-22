import { Module, DynamicModule, Global } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BffRegistryService } from './registry/bff-registry.service';
import { BffLoaderService } from './loader/bff-loader.service';
import { BffModuleOptions } from './interfaces/bff-module.interface';
import { GatewayModule } from '@/modules/gateway/gateway.module';
import { AggregatorModule } from '@/modules/aggregator/aggregator.module';
import { MultiEndModule } from '@/modules/multi-end/multi-end.module';
import { PaginationModule } from '@/modules/pagination/pagination.module';
import { CacheModule } from '@/modules/cache/cache.module';

@Global()
@Module({
  imports: [
    DiscoveryModule,
    GatewayModule,
    AggregatorModule,
    MultiEndModule,
    PaginationModule,
    CacheModule,
  ],
  providers: [BffRegistryService, BffLoaderService],
  exports: [BffRegistryService, BffLoaderService],
})
export class BffCoreModule {
  static register(options: BffModuleOptions = {}): DynamicModule {
    return {
      module: BffCoreModule,
      providers: [
        {
          provide: 'BFF_OPTIONS',
          useValue: options,
        },
      ],
    };
  }

  static forFeature(featureModule: any): DynamicModule {
    return {
      module: BffCoreModule,
      imports: [featureModule],
    };
  }
}
