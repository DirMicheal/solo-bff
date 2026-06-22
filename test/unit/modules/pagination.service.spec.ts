import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from '@/modules/pagination/pagination.service';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ClientType } from '@/common/enums/index.enum';

describe('PaginationService', () => {
  let service: PaginationService;
  let multiEndService: jest.Mocked<MultiEndService>;

  beforeEach(async () => {
    multiEndService = {
      getPageConfig: jest.fn(() => ({ pageSize: 10, maxPageSize: 50 })),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginationService,
        {
          provide: MultiEndService,
          useValue: multiEndService,
        },
      ],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
  });

  describe('normalizePagination', () => {
    it('should use default values when not provided', () => {
      const pagination: PaginationDto = {};

      const result = service.normalizePagination(pagination, ClientType.PC);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.skip).toBe(0);
    });

    it('should use provided values', () => {
      const pagination: PaginationDto = { page: 3, pageSize: 25 };

      const result = service.normalizePagination(pagination, ClientType.PC);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(25);
      expect(result.skip).toBe(50);
    });

    it('should enforce minimum page of 1', () => {
      const pagination: PaginationDto = { page: 0 };

      const result = service.normalizePagination(pagination, ClientType.PC);

      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });

    it('should enforce maxPageSize from multiEnd config', () => {
      multiEndService.getPageConfig.mockReturnValue({ pageSize: 10, maxPageSize: 20 });
      const pagination: PaginationDto = { pageSize: 100 };

      const result = service.normalizePagination(pagination, ClientType.PC);

      expect(result.pageSize).toBe(20);
    });

    it('should calculate skip correctly for various pages', () => {
      expect(service.normalizePagination({ page: 1, pageSize: 10 } as PaginationDto).skip).toBe(0);
      expect(service.normalizePagination({ page: 2, pageSize: 10 } as PaginationDto).skip).toBe(10);
      expect(service.normalizePagination({ page: 5, pageSize: 20 } as PaginationDto).skip).toBe(80);
    });
  });

  describe('buildPageResult', () => {
    it('should build page result correctly', () => {
      const list = [1, 2, 3];
      const result = service.buildPageResult(list, 10, 1, 3);

      expect(result.list).toEqual(list);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(3);
      expect(result.totalPages).toBe(4);
    });

    it('should handle empty list', () => {
      const result = service.buildPageResult([], 0, 1, 10);

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', () => {
      expect(service.buildPageResult([], 10, 1, 10).totalPages).toBe(1);
      expect(service.buildPageResult([], 11, 1, 10).totalPages).toBe(2);
      expect(service.buildPageResult([], 100, 1, 20).totalPages).toBe(5);
    });
  });

  describe('paginate', () => {
    it('should fetch and build page result', async () => {
      const mockList = [1, 2, 3, 4, 5];
      const fetchFn = jest.fn().mockResolvedValue({
        list: mockList,
        total: 25,
      });
      const pagination: PaginationDto = { page: 2, pageSize: 5 };

      const result = await service.paginate(fetchFn, pagination, ClientType.PC);

      expect(fetchFn).toHaveBeenCalledWith(5, 5);
      expect(result.list).toEqual(mockList);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBe(5);
    });

    it('should handle client type specific page config', async () => {
      multiEndService.getPageConfig.mockReturnValue({ pageSize: 10, maxPageSize: 100 });
      const fetchFn = jest.fn().mockResolvedValue({ list: [], total: 0 });
      const pagination: PaginationDto = {};

      await service.paginate(fetchFn, pagination, ClientType.PC);

      expect(multiEndService.getPageConfig).toHaveBeenCalledWith(ClientType.PC);
    });
  });

  describe('toServiceParams', () => {
    it('should convert pagination to service params', () => {
      const pagination: PaginationDto = { page: 3, pageSize: 20 };

      const result = service.toServiceParams(pagination, ClientType.PC);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });
  });
});
