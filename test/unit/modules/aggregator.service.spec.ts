import { Test, TestingModule } from '@nestjs/testing';
import { AggregatorService } from '@/modules/aggregator/aggregator.service';
import { ClientType } from '@/common/enums/index.enum';

describe('AggregatorService', () => {
  let service: AggregatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregatorService],
    }).compile();

    service = module.get<AggregatorService>(AggregatorService);
  });

  describe('adaptFields', () => {
    const testData = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      originalPrice: 199.99,
      stock: 100,
      description: 'This is a test product',
      images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      category: { id: 'cat-1', name: 'Electronics' },
      createdAt: '2026-06-22T00:00:00.000Z',
      tags: ['new', 'sale'],
    };

    it('should process arrays by applying adapter to each item', () => {
      const dataArray = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const config = { include: ['id'] };

      const result = service.adaptFields(dataArray, config, ClientType.PC);

      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('should return non-object data as-is', () => {
      expect(service.adaptFields('string', {}, ClientType.PC)).toBe('string');
      expect(service.adaptFields(123, {}, ClientType.PC)).toBe(123);
      expect(service.adaptFields(null, {}, ClientType.PC)).toBeNull();
      expect(service.adaptFields(undefined, {}, ClientType.PC)).toBeUndefined();
    });

    it('should include only specified fields', () => {
      const config = { include: ['id', 'name', 'price'] };

      const result = service.adaptFields(testData, config, ClientType.PC);

      expect(result).toEqual({
        id: '1',
        name: 'Test Product',
        price: 99.99,
      });
      expect(result.description).toBeUndefined();
      expect(result.images).toBeUndefined();
    });

    it('should exclude specified fields', () => {
      const config = { exclude: ['description', 'createdAt', 'tags'] };

      const result = service.adaptFields(testData, config, ClientType.PC);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Test Product');
      expect(result.description).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });

    describe('mappings', () => {
      it('should map fields with simple string mapping', () => {
        const config = {
          mappings: {
            productId: 'id',
            productName: 'name',
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.productId).toBe('1');
        expect(result.productName).toBe('Test Product');
      });

      it('should map nested fields', () => {
        const config = {
          mappings: {
            categoryId: 'category.id',
            categoryName: 'category.name',
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.categoryId).toBe('cat-1');
        expect(result.categoryName).toBe('Electronics');
      });

      it('should map array index fields', () => {
        const config = {
          mappings: {
            firstImage: 'images[0]',
            secondImage: 'images[1]',
            thumbnail: 'images[0]',
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.firstImage).toBe('img1.jpg');
        expect(result.secondImage).toBe('img2.jpg');
        expect(result.thumbnail).toBe('img1.jpg');
      });

      it('should apply transform function', () => {
        const config = {
          mappings: {
            priceText: {
              source: 'price',
              transform: (value: number) => `¥${value.toFixed(2)}`,
            },
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.priceText).toBe('¥99.99');
      });

      it('should use default value when source is undefined', () => {
        const config = {
          mappings: {
            discount: {
              source: 'nonExistentField',
              default: 0,
            },
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.discount).toBe(0);
      });

      it('should apply condition before mapping', () => {
        const config = {
          mappings: {
            discountText: {
              source: 'price',
              transform: (v: number) => `Discount: ${(199.99 - v).toFixed(2)}`,
              condition: (data: any) => data.price < data.originalPrice,
            },
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);
        expect(result.discountText).toBeDefined();

        const fullPriceData = { ...testData, price: 199.99, originalPrice: 199.99 };
        const result2 = service.adaptFields(fullPriceData, config, ClientType.PC);
        expect(result2.discountText).toBeUndefined();
      });

      it('should apply client type condition', () => {
        const config = {
          mappings: {
            mobileField: {
              source: 'name',
              condition: (data: any, clientType: ClientType) =>
                clientType === ClientType.MINI_PROGRAM || clientType === ClientType.APP,
            },
          },
        };

        const resultPc = service.adaptFields(testData, config, ClientType.PC);
        expect(resultPc.mobileField).toBeUndefined();

        const resultApp = service.adaptFields(testData, config, ClientType.APP);
        expect(resultApp.mobileField).toBe('Test Product');
      });

      it('should set nested target path', () => {
        const config = {
          mappings: {
            'info.productId': 'id',
            'info.productName': 'name',
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.info).toBeDefined();
        expect(result.info.productId).toBe('1');
        expect(result.info.productName).toBe('Test Product');
      });
    });

    describe('computed fields', () => {
      it('should compute fields based on original data', () => {
        const config = {
          computed: {
            displayName: (data: any) => `${data.name} - ¥${data.price}`,
            hasDiscount: (data: any) => data.price < data.originalPrice,
            imageCount: (data: any) => data.images.length,
          },
        };

        const result = service.adaptFields(testData, config, ClientType.PC);

        expect(result.displayName).toBe('Test Product - ¥99.99');
        expect(result.hasDiscount).toBe(true);
        expect(result.imageCount).toBe(3);
      });
    });

    it('should apply all transformations in order: include -> exclude -> mappings -> computed', () => {
      const config = {
        include: ['id', 'name', 'price', 'originalPrice', 'images', 'category'],
        exclude: ['originalPrice'],
        mappings: {
          productId: 'id',
          mainImage: 'images[0]',
        },
        computed: {
          displayName: (data: any) => data.name,
        },
      };

      const result = service.adaptFields(testData, config, ClientType.PC);

      expect(result.id).toBeUndefined();
      expect(result.productId).toBe('1');
      expect(result.name).toBe('Test Product');
      expect(result.price).toBe(99.99);
      expect(result.originalPrice).toBeUndefined();
      expect(result.mainImage).toBe('img1.jpg');
      expect(result.displayName).toBe('Test Product');
      expect(result.category).toEqual({ id: 'cat-1', name: 'Electronics' });
    });
  });

  describe('aggregate', () => {
    it('should aggregate multiple sources in parallel', async () => {
      const config = {
        sources: [
          { name: 'user', fetcher: () => Promise.resolve({ id: '1', name: 'User 1' }) },
          { name: 'product', fetcher: () => Promise.resolve({ id: 'p1', price: 99 }) },
        ],
        mergeStrategy: 'shallow' as const,
      };

      const result = await service.aggregate(config);

      expect(result.user).toEqual({ id: '1', name: 'User 1' });
      expect(result.product).toEqual({ id: 'p1', price: 99 });
    });

    it('should respect dependencies between sources', async () => {
      const executionOrder: string[] = [];
      const config = {
        sources: [
          {
            name: 'order',
            fetcher: async () => {
              executionOrder.push('order');
              return { id: 'order-1', userId: 'user-1' };
            },
          },
          {
            name: 'user',
            fetcher: async (params: any) => {
              executionOrder.push('user');
              expect(params.order.userId).toBe('user-1');
              return { id: params.order.userId, name: 'User' };
            },
            dependsOn: ['order'],
          },
          {
            name: 'invoice',
            fetcher: async (params: any) => {
              executionOrder.push('invoice');
              expect(params.order.id).toBe('order-1');
              expect(params.user.id).toBe('user-1');
              return { id: 'inv-1' };
            },
            dependsOn: ['order', 'user'],
          },
        ],
        mergeStrategy: 'shallow' as const,
      };

      await service.aggregate(config);

      expect(executionOrder[0]).toBe('order');
      expect(executionOrder[1]).toBe('user');
      expect(executionOrder[2]).toBe('invoice');
    });

    it('should use custom merge function', async () => {
      const config = {
        sources: [
          { name: 'a', fetcher: () => Promise.resolve({ value: 1 }) },
          { name: 'b', fetcher: () => Promise.resolve({ value: 2 }) },
        ],
        mergeStrategy: 'custom' as const,
        mergeFn: (results: any) => ({
          total: results.a.value + results.b.value,
          items: [results.a, results.b],
        }),
      };

      const result = await service.aggregate(config);

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(2);
    });

    it('should use deep merge strategy', async () => {
      const config = {
        sources: [
          { name: 'base', fetcher: () => Promise.resolve({ a: 1, nested: { x: 1 } }) },
          { name: 'override', fetcher: () => Promise.resolve({ b: 2, nested: { y: 2 } }) },
        ],
        mergeStrategy: 'deep' as const,
      };

      const result = await service.aggregate(config);

      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
      expect(result.nested.x).toBe(1);
      expect(result.nested.y).toBe(2);
    });

    it('should set null for failed sources and continue', async () => {
      const config = {
        sources: [
          { name: 'success', fetcher: () => Promise.resolve({ data: 'ok' }) },
          { name: 'fail', fetcher: () => Promise.reject(new Error('Failed')) },
        ],
        mergeStrategy: 'shallow' as const,
      };

      const result = await service.aggregate(config);

      expect(result.success).toEqual({ data: 'ok' });
      expect(result.fail).toBeNull();
    });

    it('should apply fieldAdapter after aggregation', async () => {
      const config = {
        sources: [
          { name: 'user', fetcher: () => Promise.resolve({ id: '1', name: 'User', email: 'user@example.com' }) },
        ],
        mergeStrategy: 'shallow' as const,
        fieldAdapter: {
          mappings: {
            userId: 'user.id',
            userName: 'user.name',
            userEmail: 'user.email',
          },
        },
      };

      const result = await service.aggregate(config);

      expect(result.userId).toBe('1');
      expect(result.userName).toBe('User');
      expect(result.userEmail).toBe('user@example.com');
      expect(result.user).toBeDefined();
    });
  });
});
