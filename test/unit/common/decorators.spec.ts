import {
  SkipAuth,
  ClientTypes,
  Cacheable,
  FieldMapping,
  DataTransform,
  SKIP_AUTH_KEY,
  CLIENT_TYPES_KEY,
  FIELD_MAPPING_KEY,
  DATA_TRANSFORM_KEY,
} from '@/common/decorators/index.decorator';
import { ClientType } from '@/common/enums/index.enum';

describe('Decorators', () => {
  describe('SkipAuth', () => {
    it('should set SKIP_AUTH_KEY metadata to true', () => {
      class TestClass {
        @SkipAuth()
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(SKIP_AUTH_KEY, TestClass.prototype.testMethod);
      expect(metadata).toBe(true);
    });

    it('should work on class level', () => {
      @SkipAuth()
      class TestClass {}

      const metadata = Reflect.getMetadata(SKIP_AUTH_KEY, TestClass);
      expect(metadata).toBe(true);
    });
  });

  describe('ClientTypes', () => {
    it('should set CLIENT_TYPES_KEY metadata with specified client types', () => {
      class TestClass {
        @ClientTypes(ClientType.PC, ClientType.APP)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CLIENT_TYPES_KEY,
        TestClass.prototype.testMethod,
      );
      expect(metadata).toEqual([ClientType.PC, ClientType.APP]);
    });

    it('should work with single client type', () => {
      class TestClass {
        @ClientTypes(ClientType.MINI_PROGRAM)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        CLIENT_TYPES_KEY,
        TestClass.prototype.testMethod,
      );
      expect(metadata).toEqual([ClientType.MINI_PROGRAM]);
    });
  });

  describe('Cacheable', () => {
    it('should set cache key and ttl metadata', () => {
      const ttl = 300;
      const key = 'custom_cache_key';

      class TestClass {
        @Cacheable(key, ttl)
        testMethod() {}
      }

      const keyMetadata = Reflect.getMetadata('cache_key', TestClass.prototype.testMethod);
      const ttlMetadata = Reflect.getMetadata('cache_ttl', TestClass.prototype.testMethod);

      expect(keyMetadata).toBe(key);
      expect(ttlMetadata).toBe(ttl);
    });

    it('should use method name as default key', () => {
      class TestClass {
        @Cacheable()
        testMethod() {}
      }

      const keyMetadata = Reflect.getMetadata('cache_key', TestClass.prototype.testMethod);
      expect(keyMetadata).toBe('testMethod');
    });

    it('should not set ttl if not provided', () => {
      class TestClass {
        @Cacheable('key_without_ttl')
        testMethod() {}
      }

      const ttlMetadata = Reflect.getMetadata('cache_ttl', TestClass.prototype.testMethod);
      expect(ttlMetadata).toBeUndefined();
    });
  });

  describe('FieldMapping', () => {
    it('should set FIELD_MAPPING_KEY metadata', () => {
      const mapping = {
        userId: 'id',
        userName: 'name',
      };

      class TestClass {
        @FieldMapping(mapping)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        FIELD_MAPPING_KEY,
        TestClass.prototype.testMethod,
      );
      expect(metadata).toEqual(mapping);
    });
  });

  describe('DataTransform', () => {
    it('should set DATA_TRANSFORM_KEY metadata', () => {
      const transformFn = (data: any) => ({ transformed: data });

      class TestClass {
        @DataTransform(transformFn)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        DATA_TRANSFORM_KEY,
        TestClass.prototype.testMethod,
      );
      expect(metadata).toBe(transformFn);
    });
  });
});
