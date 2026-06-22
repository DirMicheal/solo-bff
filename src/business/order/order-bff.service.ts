import { Injectable } from '@nestjs/common';
import { BffBaseService } from '@/core/base/bff-base.service';
import { ServiceName, CacheKeyPrefix, ClientType } from '@/common/enums/index.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { AggregateConfig } from '@/modules/aggregator/aggregator.service';

@Injectable()
export class OrderBffService extends BffBaseService {
  async getOrderDetail(orderId: string): Promise<any> {
    return this.withCache(
      this.buildCacheKey(CacheKeyPrefix.ORDER, orderId),
      () =>
        this.fetchFromService(ServiceName.ORDER, `/orders/${orderId}`, {
          fallback: {
            id: orderId,
            orderNo: '',
            status: 0,
            totalAmount: 0,
            items: [],
            userId: '',
            createdAt: new Date().toISOString(),
          },
        }),
      60,
    );
  }

  async getOrderList(pagination: PaginationDto, userId: string): Promise<any> {
    const { skip, page, pageSize } = this.normalizePagination(pagination);

    const data = await this.fetchFromService(ServiceName.ORDER, '/orders', {
      params: { userId, offset: skip, limit: pageSize },
      fallback: { list: [], total: 0 },
    });

    return this.pagination.buildPageResult(
      data?.list || [],
      data?.total || 0,
      page,
      pageSize,
    );
  }

  async createOrder(orderData: any): Promise<any> {
    const result = await this.fetchFromService(ServiceName.ORDER, '/orders', {
      method: 'POST',
      data: orderData,
    });
    return result;
  }

  async getOrderDetailFull(orderId: string): Promise<any> {
    const config: AggregateConfig = {
      sources: [
        {
          name: 'order',
          fetcher: () => this.getOrderDetail(orderId),
        },
        {
          name: 'user',
          fetcher: async (params: any) => {
            const order = params?.order;
            if (!order?.userId) return null;
            return this.fetchFromService(ServiceName.USER, `/users/${order.userId}`, {
              fallback: null,
            });
          },
          dependsOn: ['order'],
        },
        {
          name: 'products',
          fetcher: async (params: any) => {
            const order = params?.order;
            if (!order?.items?.length) return [];
            const productIds = order.items.map((item: any) => item.productId);
            return Promise.all(
              productIds.map((id: string) =>
                this.fetchFromService(ServiceName.PRODUCT, `/products/${id}`, {
                  fallback: { id, name: '商品信息丢失' },
                }),
              ),
            );
          },
          dependsOn: ['order'],
        },
      ],
      mergeStrategy: 'custom',
      mergeFn: (results: Record<string, any>) => {
        const { order, user, products } = results;
        const productMap = new Map(products?.map((p: any) => [p.id, p]) || []);

        const itemsWithProduct = order?.items?.map((item: any) => ({
          ...item,
          product: productMap.get(item.productId),
        })) || [];

        return {
          ...order,
          user: user ? {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone,
          } : null,
          items: itemsWithProduct,
        };
      },
    };

    return this.aggregator.aggregate(config);
  }

  async adaptOrderForClient(order: any, clientType: ClientType): Promise<any> {
    return this.multiEnd.adaptDataByClient(
      order,
      {
        [ClientType.PC]: {
          include: ['id', 'orderNo', 'status', 'totalAmount', 'items', 'user', 'createdAt', 'shippingAddress'],
          mappings: {
            statusText: {
              source: 'status',
              transform: (v: number) => {
                const statusMap: Record<number, string> = {
                  0: '待支付',
                  1: '已支付',
                  2: '已发货',
                  3: '已完成',
                  4: '已取消',
                };
                return statusMap[v] || '未知';
              },
            },
            amountText: {
              source: 'totalAmount',
              transform: (v: number) => `¥${v.toFixed(2)}`,
            },
          },
        },
        [ClientType.MINI_PROGRAM]: {
          include: ['id', 'orderNo', 'status', 'totalAmount', 'items', 'createdAt'],
          mappings: {
            orderId: 'id',
            orderNumber: 'orderNo',
            orderStatus: 'status',
            totalPrice: 'totalAmount',
          },
        },
        [ClientType.APP]: {
          include: ['id', 'orderNo', 'status', 'totalAmount', 'items', 'user', 'createdAt'],
          computed: {
            displayAmount: (data: any) => `¥${data.totalAmount?.toFixed(2)}`,
            itemCount: (data: any) => data.items?.length || 0,
          },
        },
        default: {
          include: ['id', 'orderNo', 'status', 'totalAmount'],
        },
      },
      clientType,
      this.aggregator,
    );
  }
}
