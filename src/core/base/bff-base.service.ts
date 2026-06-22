import { Injectable, Logger } from '@nestjs/common';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { CacheService } from '@/modules/cache/cache.service';
import { AggregatorService, FieldAdapterConfig } from '@/modules/aggregator/aggregator.service';
import { PaginationService } from '@/modules/pagination/pagination.service';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';
import { ClientType, CacheKeyPrefix } from '@/common/enums/index.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PageResult } from '@/common/dto/api-result.dto';

@Injectable()
export class BffBaseService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly gateway: GatewayService,
    protected readonly cache: CacheService,
    protected readonly aggregator: AggregatorService,
    protected readonly pagination: PaginationService,
    protected readonly multiEnd: MultiEndService,
  ) {}

  protected async fetchFromService(
    serviceName: string,
    path: string,
    options: any = {},
  ): Promise<any> {
    const { method = 'GET', params, data, fallback } = options;

    return this.gateway.request({
      serviceName,
      path,
      method,
      params,
      data,
      fallback,
    });
  }

  protected async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    return this.cache.wrap(key, fn, ttl);
  }

  protected buildCacheKey(prefix: CacheKeyPrefix | string, ...parts: string[]): string {
    return this.cache.buildKey(prefix, ...parts);
  }

  protected adaptFields(
    data: any,
    config: FieldAdapterConfig,
    clientType: ClientType = ClientType.PC,
  ): any {
    return this.aggregator.adaptFields(data, config, clientType);
  }

  protected paginate<T>(
    fetchFn: (skip: number, limit: number) => Promise<{ list: T[]; total: number }>,
    pagination: PaginationDto,
    clientType?: ClientType,
  ): Promise<PageResult<T>> {
    return this.pagination.paginate(fetchFn, pagination, clientType);
  }

  protected getPageConfig(
    clientType: ClientType,
  ): { pageSize: number; maxPageSize: number } {
    return this.multiEnd.getPageConfig(clientType);
  }

  protected normalizePagination(
    pagination: PaginationDto,
    clientType?: ClientType,
  ): { page: number; pageSize: number; skip: number } {
    return this.pagination.normalizePagination(pagination, clientType);
  }
}
