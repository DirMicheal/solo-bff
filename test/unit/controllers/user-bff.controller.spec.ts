import { Test, TestingModule } from '@nestjs/testing';
import { UserBffController } from '@/business/user/user-bff.controller';
import { UserBffService } from '@/business/user/user-bff.service';
import {
  mockGatewayService,
  mockCacheService,
  mockAggregatorService,
  mockMultiEndService,
  mockPaginationService,
  createTestUser,
  createMockRequest,
} from 'test/utils/mock-utils';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { CacheService } from '@/modules/cache/cache.service';
import { AggregatorService } from '@/modules/aggregator/aggregator.service';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';
import { PaginationService } from '@/modules/pagination/pagination.service';
import { ClientType } from '@/common/enums/index.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';

describe('UserBffController', () => {
  let controller: UserBffController;
  let userBffService: jest.Mocked<UserBffService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserBffController],
      providers: [
        { provide: GatewayService, useValue: mockGatewayService() },
        { provide: CacheService, useValue: mockCacheService() },
        { provide: AggregatorService, useValue: mockAggregatorService() },
        { provide: MultiEndService, useValue: mockMultiEndService() },
        { provide: PaginationService, useValue: mockPaginationService() },
        {
          provide: UserBffService,
          useFactory: (gw, cache, agg, me, pag) => new UserBffService(gw, cache, agg, pag, me),
          inject: [GatewayService, CacheService, AggregatorService, MultiEndService, PaginationService],
        },
      ],
    }).compile();

    controller = module.get<UserBffController>(UserBffController);
    userBffService = module.get<UserBffService>(UserBffService) as any;
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const user = createTestUser();
      const userData = { id: user.userId, name: 'Test User' };

      jest.spyOn(userBffService, 'getUserInfo').mockResolvedValue(userData);

      const result = await controller.getProfile(user);

      expect(result).toEqual(userData);
      expect(userBffService.getUserInfo).toHaveBeenCalledWith(user.userId);
    });
  });

  describe('getUser', () => {
    it('should return user data adapted for client type', async () => {
      const userId = '123';
      const clientType = ClientType.PC;
      const rawData = { id: '123', name: 'Test', email: 'test@test.com' };
      const adaptedData = { id: '123', name: 'Test' };

      jest.spyOn(userBffService, 'getUserInfo').mockResolvedValue(rawData);
      jest.spyOn(userBffService, 'adaptForClient').mockResolvedValue(adaptedData);

      const result = await controller.getUser(userId, clientType);

      expect(userBffService.getUserInfo).toHaveBeenCalledWith(userId);
      expect(userBffService.adaptForClient).toHaveBeenCalledWith(rawData, clientType);
      expect(result).toEqual(adaptedData);
    });

    it('should adapt differently for mini_program client', async () => {
      const userId = '123';
      const clientType = ClientType.MINI_PROGRAM;
      const rawData = { id: '123', name: 'Test', phone: '13800138000' };
      const adaptedData = { userId: '123', userName: 'Test' };

      jest.spyOn(userBffService, 'getUserInfo').mockResolvedValue(rawData);
      jest.spyOn(userBffService, 'adaptForClient').mockResolvedValue(adaptedData);

      const result = await controller.getUser(userId, clientType);

      expect(result).toEqual(adaptedData);
      expect(userBffService.adaptForClient).toHaveBeenCalledWith(rawData, ClientType.MINI_PROGRAM);
    });
  });

  describe('getUsers', () => {
    it('should return paginated user list', async () => {
      const pagination: PaginationDto = { page: 1, pageSize: 10 };
      const pageResult = {
        list: [{ id: '1' }, { id: '2' }],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
      };

      jest.spyOn(userBffService, 'getUserList').mockResolvedValue(pageResult);

      const result = await controller.getUsers(pagination);

      expect(result).toEqual(pageResult);
      expect(userBffService.getUserList).toHaveBeenCalledWith(pagination);
    });
  });

  describe('updateUser', () => {
    it('should update user and return result', async () => {
      const userId = '123';
      const updateData = { nickname: 'New Name' };
      const updatedUser = { id: '123', nickname: 'New Name' };

      jest.spyOn(userBffService, 'updateUser').mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(userBffService.updateUser).toHaveBeenCalledWith(userId, updateData);
    });
  });
});
