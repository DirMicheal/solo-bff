import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { of } from 'rxjs';
import { createMockExecutionContext } from 'test/utils/mock-utils';
import { ApiResult } from '@/common/dto/api-result.dto';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap plain data with ApiResult.success', (done) => {
    const data = { id: '1', name: 'test' };
    const context = createMockExecutionContext();
    const next = {
      handle: () => of(data),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(result).toBeInstanceOf(ApiResult);
      expect(result.code).toBe(0);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(data);
      done();
    });
  });

  it('should not double-wrap ApiResult', (done) => {
    const data = ApiResult.success({ id: '1' }, 'Custom message');
    const context = createMockExecutionContext();
    const next = {
      handle: () => of(data),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(result).toBe(data);
      expect(result.message).toBe('Custom message');
      done();
    });
  });

  it('should handle null data', (done) => {
    const context = createMockExecutionContext();
    const next = {
      handle: () => of(null),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(result.data).toBeNull();
      done();
    });
  });

  it('should handle undefined data', (done) => {
    const context = createMockExecutionContext();
    const next = {
      handle: () => of(undefined),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(result.data).toBeUndefined();
      done();
    });
  });

  it('should handle array data', (done) => {
    const data = [1, 2, 3];
    const context = createMockExecutionContext();
    const next = {
      handle: () => of(data),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(result.data).toEqual(data);
      done();
    });
  });

  it('should handle primitive data', (done) => {
    const context = createMockExecutionContext();
    const next = {
      handle: () => of('string data'),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(result.data).toBe('string data');
      done();
    });
  });

  it('should have timestamp in response', (done) => {
    const context = createMockExecutionContext();
    const next = {
      handle: () => of({}),
    };

    interceptor.intercept(context, next as any).subscribe((result) => {
      expect(typeof result.timestamp).toBe('number');
      expect(result.timestamp).toBeGreaterThan(0);
      done();
    });
  });
});
