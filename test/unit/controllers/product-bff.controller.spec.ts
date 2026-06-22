import { Test, TestingModule } from '@nestjs/testing';
import { ProductBffController } from '@/business/product/product-bff.controller';
import { ProductBffService } from '@/business/product/product-bff.service';
import {
  mockGatewayService,
  mockCacheService,
  mockAggregatorService,
  mockMultiEndService,
  mockPaginationService,
} from 'test/utils/mock-utils';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { CacheService } from '@/modules/cache/cache.service';
import { AggregatorService } from '@/modules/aggregator/aggregator.service';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';
import { PaginationService } from '@/modules/pagination/pagination.service';
import { ClientType } from '@/common/enums/index.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';

describe('ProductBffController', () => {
  let controller: ProductBffController;
  let productBffService: jest.Mocked<ProductBffService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductBffController],
      providers: [
        { provide: GatewayService, useValue: mockGatewayService() },
        { provide: CacheService, useValue: mockCacheService() },
        { provide: AggregatorService, useValue: mockAggregatorService() },
        { provide: MultiEndService, useValue: mockMultiEndService() },
        { provide: PaginationService, useValue: mockPaginationService() },
        {
          provide: ProductBffService,
          useFactory: (gw, cache, agg, me, pag) => new ProductBffService(gw, cache, agg, pag, me),
          inject: [GatewayService, CacheService, AggregatorService, MultiEndService, PaginationService],
        },
      ],
    }).compile();

    controller = module.get<ProductBffController>(ProductBffController);
    productBffService = module.get<ProductBffService>(ProductBffService) as any;
  });

  describe('getProducts', () => {
    it('should return paginated product list', async () => {
      const pagination: PaginationDto = { page: 1, pageSize: 10 };
      const clientType = ClientType.PC;
      const expectedResult = {
        list: [{ id: '1', name: 'Product 1' }, { id: '2', name: 'Product 2' }],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
      };

      jest.spyOn(productBffService, 'getProductList').mockResolvedValue(expectedResult);

      const result = await controller.getProducts(pagination, {});

      expect(productBffService.getProductList).toHaveBeenCalledWith(pagination, {});
      expect(result).toEqual(expectedResult);
    });

    it('should handle mini_program client type with filters', async () => {
      const pagination: PaginationDto = { page: 1 };
      const filters = { category: 'electronics' };
      const expectedResult = {
        list: [{ id: '1', name: 'Product 1' }],
        total: 50,
        page: 1,
        pageSize: 10,
        totalPages: 5,
      };

      jest.spyOn(productBffService, 'getProductList').mockResolvedValue(expectedResult);

      const result = await controller.getProducts(pagination, filters);

      expect(productBffService.getProductList).toHaveBeenCalledWith(pagination, filters);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('getProductDetail', () => {
    it('should return product detail', async () => {
      const productId = 'prod-123';
      const rawData = {
        id: 'prod-123',
        name: 'Test Product',
        price: 99.99,
        description: 'Detailed description',
        images: ['img1.jpg', 'img2.jpg'],
        category: { id: 'cat-1', name: 'Category' },
      };

      jest.spyOn(productBffService, 'getProductDetail').mockResolvedValue(rawData);

      const result = await controller.getProductDetail(productId);

      expect(productBffService.getProductDetail).toHaveBeenCalledWith(productId);
      expect(result).toEqual(rawData);
    });
  });

  describe('getProductFull', () => {
    it('should return aggregated product detail adapted for PC client', async () => {
      const productId = 'prod-123';
      const clientType = ClientType.PC;
      const aggregatedData = {
        id: 'prod-123',
        name: 'Test Product',
        price: 99.99,
        description: 'Detailed description',
        images: ['img1.jpg'],
        category: { id: 'cat-1', name: 'Category' },
      };
      const adaptedData = { ...aggregatedData, description: 'Detailed description' };

      jest.spyOn(productBffService, 'getProductDetailAggregated').mockResolvedValue(aggregatedData);
      jest.spyOn(productBffService, 'adaptProductForClient').mockResolvedValue(adaptedData);

      const result = await controller.getProductFull(productId, clientType);

      expect(productBffService.getProductDetailAggregated).toHaveBeenCalledWith(productId);
      expect(productBffService.adaptProductForClient).toHaveBeenCalledWith(aggregatedData, clientType);
      expect(result).toEqual(adaptedData);
    });

    it('should return adapted product detail for mini_program client', async () => {
      const productId = 'prod-123';
      const clientType = ClientType.MINI_PROGRAM;
      const aggregatedData = {
        id: 'prod-123',
        name: 'Test Product',
        price: 99.99,
        description: 'Detailed description',
        images: ['img1.jpg', 'img2.jpg'],
      };
      const adaptedData = {
        productId: 'prod-123',
        productName: 'Test Product',
        price: 99.99,
        thumbnail: 'img1.jpg',
      };

      jest.spyOn(productBffService, 'getProductDetailAggregated').mockResolvedValue(aggregatedData);
      jest.spyOn(productBffService, 'adaptProductForClient').mockResolvedValue(adaptedData);

      const result = await controller.getProductFull(productId, clientType);

      expect(productBffService.adaptProductForClient).toHaveBeenCalledWith(aggregatedData, ClientType.MINI_PROGRAM);
      expect(result.thumbnail).toBeDefined();
      expect(result.description).toBeUndefined();
    });
  });
});
