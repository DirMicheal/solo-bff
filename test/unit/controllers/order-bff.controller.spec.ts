import { Test, TestingModule } from '@nestjs/testing';
import { OrderBffController } from '@/business/order/order-bff.controller';
import { OrderBffService } from '@/business/order/order-bff.service';
import {
  mockGatewayService,
  mockCacheService,
  mockAggregatorService,
  mockMultiEndService,
  mockPaginationService,
  createTestUser,
} from 'test/utils/mock-utils';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { CacheService } from '@/modules/cache/cache.service';
import { AggregatorService } from '@/modules/aggregator/aggregator.service';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';
import { PaginationService } from '@/modules/pagination/pagination.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ClientType } from '@/common/enums/index.enum';

describe('OrderBffController', () => {
  let controller: OrderBffController;
  let orderBffService: jest.Mocked<OrderBffService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderBffController],
      providers: [
        { provide: GatewayService, useValue: mockGatewayService() },
        { provide: CacheService, useValue: mockCacheService() },
        { provide: AggregatorService, useValue: mockAggregatorService() },
        { provide: MultiEndService, useValue: mockMultiEndService() },
        { provide: PaginationService, useValue: mockPaginationService() },
        {
          provide: OrderBffService,
          useFactory: (gw, cache, agg, me, pag) => new OrderBffService(gw, cache, agg, pag, me),
          inject: [GatewayService, CacheService, AggregatorService, MultiEndService, PaginationService],
        },
      ],
    }).compile();

    controller = module.get<OrderBffController>(OrderBffController);
    orderBffService = module.get<OrderBffService>(OrderBffService) as any;
  });

  describe('createOrder', () => {
    it('should create order', async () => {
      const createData = { items: [{ productId: 'p1', quantity: 2 }] };
      const createdOrder = { id: 'order-1', status: 'pending' };

      jest.spyOn(orderBffService, 'createOrder').mockResolvedValue(createdOrder);

      const result = await controller.createOrder(createData);

      expect(orderBffService.createOrder).toHaveBeenCalledWith(createData);
      expect(result).toEqual(createdOrder);
    });
  });

  describe('getOrders', () => {
    it('should return order list for user', async () => {
      const userId = 'user-1';
      const pagination: PaginationDto = { page: 1, pageSize: 10 };
      const expectedResult = {
        list: [{ id: 'order-1', total: 199.98 }],
        total: 5,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      jest.spyOn(orderBffService, 'getOrderList').mockResolvedValue(expectedResult);

      const result = await controller.getOrders(pagination, userId);

      expect(orderBffService.getOrderList).toHaveBeenCalledWith(pagination, userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getOrderDetail', () => {
    it('should return order detail', async () => {
      const orderId = 'order-123';
      const orderData = {
        id: 'order-123',
        status: 'paid',
        total: 199.98,
      };

      jest.spyOn(orderBffService, 'getOrderDetail').mockResolvedValue(orderData);

      const result = await controller.getOrderDetail(orderId);

      expect(orderBffService.getOrderDetail).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(orderData);
    });
  });

  describe('getOrderFull', () => {
    it('should return fully aggregated order detail adapted for client', async () => {
      const orderId = 'order-456';
      const clientType = ClientType.PC;
      const fullData = {
        id: 'order-456',
        status: 'paid',
        user: { id: 'user-1', name: 'Test User' },
        items: [{ productId: 'p1', productName: 'Product 1' }],
      };
      const adaptedData = {
        orderId: 'order-456',
        status: 'paid',
        userInfo: { id: 'user-1', name: 'Test User' },
        products: [{ productId: 'p1', name: 'Product 1' }],
      };

      jest.spyOn(orderBffService, 'getOrderDetailFull').mockResolvedValue(fullData);
      jest.spyOn(orderBffService, 'adaptOrderForClient').mockResolvedValue(adaptedData);

      const result = await controller.getOrderFull(orderId, clientType);

      expect(orderBffService.getOrderDetailFull).toHaveBeenCalledWith(orderId);
      expect(orderBffService.adaptOrderForClient).toHaveBeenCalledWith(fullData, clientType);
      expect(result).toEqual(adaptedData);
    });
  });
});
