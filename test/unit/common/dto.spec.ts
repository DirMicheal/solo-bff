import { ApiResult, PageResult } from '@/common/dto/api-result.dto';
import { ErrorCode } from '@/common/enums/index.enum';

describe('DTO Tests', () => {
  describe('ApiResult', () => {
    it('should create success result', () => {
      const data = { id: '1', name: 'test' };
      const result = ApiResult.success(data);

      expect(result.code).toBe(ErrorCode.SUCCESS);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(data);
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });

    it('should create success result with custom message', () => {
      const result = ApiResult.success(null, 'Custom message');
      expect(result.message).toBe('Custom message');
    });

    it('should create fail result', () => {
      const result = ApiResult.fail(ErrorCode.ERROR, 'Something went wrong', { details: 'error' });

      expect(result.code).toBe(ErrorCode.ERROR);
      expect(result.message).toBe('Something went wrong');
      expect(result.data).toEqual({ details: 'error' });
      expect(result.timestamp).toBeDefined();
    });

    it('should create fail result without data', () => {
      const result = ApiResult.fail(ErrorCode.NOT_FOUND, 'Not found');
      expect(result.data).toBeNull();
    });
  });

  describe('PageResult', () => {
    it('should create page result correctly', () => {
      const list = [1, 2, 3, 4, 5];
      const result = new PageResult(list, 25, 2, 10);

      expect(result.list).toEqual(list);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should calculate totalPages correctly', () => {
      expect(new PageResult([], 0, 1, 10).totalPages).toBe(0);
      expect(new PageResult([], 10, 1, 10).totalPages).toBe(1);
      expect(new PageResult([], 11, 1, 10).totalPages).toBe(2);
    });
  });
});
