import { Injectable } from '@nestjs/common';
import { BffBaseService } from '@/core/base/bff-base.service';
import { ServiceName, CacheKeyPrefix, ClientType } from '@/common/enums/index.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { AggregateConfig } from '@/modules/aggregator/aggregator.service';

@Injectable()
export class ProductBffService extends BffBaseService {
  async getProductDetail(productId: string): Promise<any> {
    return this.withCache(
      this.buildCacheKey(CacheKeyPrefix.PRODUCT, productId),
      () =>
        this.fetchFromService(ServiceName.PRODUCT, `/products/${productId}`, {
          fallback: {
            id: productId,
            name: '示例商品',
            price: 0,
            stock: 0,
            description: '',
            images: [],
            categoryId: '',
          },
        }),
      600,
    );
  }

  async getProductList(pagination: PaginationDto, filters: any = {}): Promise<any> {
    const { skip, page, pageSize } = this.normalizePagination(pagination);

    const data = await this.fetchFromService(ServiceName.PRODUCT, '/products', {
      params: { offset: skip, limit: pageSize, ...filters },
      fallback: { list: [], total: 0 },
    });

    return this.pagination.buildPageResult(
      data?.list || [],
      data?.total || 0,
      page,
      pageSize,
    );
  }

  async getProductDetailAggregated(productId: string): Promise<any> {
    const config: AggregateConfig = {
      sources: [
        {
          name: 'product',
          fetcher: () => this.getProductDetail(productId),
        },
        {
          name: 'category',
          fetcher: async (params: any) => {
            const product = params?.product;
            if (!product?.categoryId) return null;
            return this.fetchFromService(
              ServiceName.PRODUCT,
              `/categories/${product.categoryId}`,
              { fallback: { id: '', name: '默认分类' } },
            );
          },
          dependsOn: ['product'],
        },
      ],
      mergeStrategy: 'custom',
      mergeFn: (results: Record<string, any>) => ({
        ...results.product,
        category: results.category,
      }),
    };

    return this.aggregator.aggregate(config);
  }

  async adaptProductForClient(product: any, clientType: ClientType): Promise<any> {
    return this.multiEnd.adaptDataByClient(
      product,
      {
        [ClientType.PC]: {
          include: ['id', 'name', 'price', 'originalPrice', 'stock', 'description', 'images', 'category'],
          mappings: {
            priceText: {
              source: 'price',
              transform: (v: number) => `¥${v.toFixed(2)}`,
            },
          },
        },
        [ClientType.MINI_PROGRAM]: {
          include: ['id', 'name', 'price', 'image', 'sales'],
          mappings: {
            goodsId: 'id',
            goodsName: 'name',
            goodsImage: 'images[0]',
          },
        },
        [ClientType.APP]: {
          include: ['id', 'name', 'price', 'images', 'tags', 'sales'],
          computed: {
            displayPrice: (data: any) => `¥${data.price}`,
            imageUrl: (data: any) => data.images?.[0] || '',
          },
        },
        default: {
          include: ['id', 'name', 'price', 'images'],
        },
      },
      clientType,
      this.aggregator,
    );
  }
}
