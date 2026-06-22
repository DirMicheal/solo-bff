import { Injectable } from '@nestjs/common';
import { BffBaseService } from '@/core/base/bff-base.service';
import { ServiceName, CacheKeyPrefix, ClientType } from '@/common/enums/index.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { FieldAdapterConfig } from '@/modules/aggregator/aggregator.service';

@Injectable()
export class UserBffService extends BffBaseService {
  async getUserInfo(userId: string): Promise<any> {
    return this.withCache(
      this.buildCacheKey(CacheKeyPrefix.USER, userId),
      () =>
        this.fetchFromService(ServiceName.USER, `/users/${userId}`, {
          fallback: {
            id: userId,
            username: 'fallback_user',
            nickname: '用户',
            avatar: '',
            phone: '',
            email: '',
            level: 1,
            vipLevel: 0,
          },
        }),
      300,
    );
  }

  async getUserList(pagination: PaginationDto): Promise<any> {
    const { skip, page, pageSize } = this.normalizePagination(pagination);

    const data = await this.fetchFromService(ServiceName.USER, '/users', {
      params: { offset: skip, limit: pageSize },
      fallback: { list: [], total: 0 },
    });

    return this.pagination.buildPageResult(
      data?.list || [],
      data?.total || 0,
      page,
      pageSize,
    );
  }

  async updateUser(userId: string, data: any): Promise<any> {
    const result = await this.fetchFromService(
      ServiceName.USER,
      `/users/${userId}`,
      {
        method: 'PUT',
        data,
      },
    );

    await this.cache.del(this.buildCacheKey(CacheKeyPrefix.USER, userId));

    return result;
  }

  async adaptForClient(userData: any, clientType: ClientType): Promise<any> {
    const adapterConfig: Record<ClientType, FieldAdapterConfig> = {
      [ClientType.PC]: {
        include: ['id', 'username', 'nickname', 'avatar', 'email', 'phone', 'level', 'vipLevel'],
      },
      [ClientType.MINI_PROGRAM]: {
        include: ['id', 'nickname', 'avatar', 'phone'],
        mappings: {
          userId: 'id',
          userName: 'nickname',
          userAvatar: 'avatar',
        },
      },
      [ClientType.APP]: {
        include: ['id', 'nickname', 'avatar', 'level', 'vipLevel'],
        computed: {
          displayName: (data: any) => `${data.nickname} (V${data.vipLevel || 0})`,
        },
      },
      [ClientType.H5]: {
        include: ['id', 'nickname', 'avatar'],
      },
    } as Record<ClientType, FieldAdapterConfig>;

    const config = adapterConfig[clientType] || adapterConfig[ClientType.PC];
    return this.adaptFields(userData, config, clientType);
  }
}
