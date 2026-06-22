import { PaginationUtils, FieldUtils, UrlUtils } from '@/common/utils/index.util';

describe('Utils Tests', () => {
  describe('PaginationUtils', () => {
    describe('getSkip', () => {
      it('should calculate skip correctly for first page', () => {
        expect(PaginationUtils.getSkip(1, 10)).toBe(0);
      });

      it('should calculate skip correctly for second page', () => {
        expect(PaginationUtils.getSkip(2, 10)).toBe(10);
      });

      it('should calculate skip correctly with custom page size', () => {
        expect(PaginationUtils.getSkip(3, 20)).toBe(40);
      });
    });

    describe('getTotalPages', () => {
      it('should calculate total pages correctly', () => {
        expect(PaginationUtils.getTotalPages(100, 10)).toBe(10);
        expect(PaginationUtils.getTotalPages(105, 10)).toBe(11);
        expect(PaginationUtils.getTotalPages(5, 10)).toBe(1);
        expect(PaginationUtils.getTotalPages(0, 10)).toBe(0);
      });
    });

    describe('buildPaginationParams', () => {
      it('should use default values when not provided', () => {
        const result = PaginationUtils.buildPaginationParams(undefined as any, undefined as any);
        expect(result).toEqual({ page: 1, pageSize: 10, skip: 0 });
      });

      it('should use provided values', () => {
        const result = PaginationUtils.buildPaginationParams(3, 25);
        expect(result).toEqual({ page: 3, pageSize: 25, skip: 50 });
      });
    });
  });

  describe('FieldUtils', () => {
    const testObj = {
      id: '1',
      name: 'test',
      email: 'test@example.com',
      password: 'secret',
      profile: {
        age: 25,
        address: {
          city: 'Beijing',
          street: 'Main St',
        },
      },
      tags: ['a', 'b', 'c'],
      items: [
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' },
      ],
    };

    describe('parsePath', () => {
      it('should parse simple dot notation path', () => {
        expect(FieldUtils.parsePath('name')).toEqual(['name']);
        expect(FieldUtils.parsePath('profile.age')).toEqual(['profile', 'age']);
        expect(FieldUtils.parsePath('a.b.c')).toEqual(['a', 'b', 'c']);
      });

      it('should parse array index path', () => {
        expect(FieldUtils.parsePath('tags[0]')).toEqual(['tags', '0']);
        expect(FieldUtils.parsePath('items[1].name')).toEqual(['items', '1', 'name']);
      });

      it('should parse mixed path', () => {
        expect(FieldUtils.parsePath('profile.address.city')).toEqual(['profile', 'address', 'city']);
        expect(FieldUtils.parsePath('items[0].id')).toEqual(['items', '0', 'id']);
      });

      it('should throw error for invalid bracket syntax', () => {
        expect(() => FieldUtils.parsePath('tags[0')).toThrow();
      });
    });

    describe('nestedGet', () => {
      it('should get simple property', () => {
        expect(FieldUtils.nestedGet(testObj, 'name')).toBe('test');
      });

      it('should get nested property', () => {
        expect(FieldUtils.nestedGet(testObj, 'profile.age')).toBe(25);
        expect(FieldUtils.nestedGet(testObj, 'profile.address.city')).toBe('Beijing');
      });

      it('should get array element', () => {
        expect(FieldUtils.nestedGet(testObj, 'tags[0]')).toBe('a');
        expect(FieldUtils.nestedGet(testObj, 'items[1].name')).toBe('item2');
      });

      it('should return undefined for non-existent path', () => {
        expect(FieldUtils.nestedGet(testObj, 'nonExistent')).toBeUndefined();
        expect(FieldUtils.nestedGet(testObj, 'profile.nonExistent')).toBeUndefined();
        expect(FieldUtils.nestedGet(testObj, 'tags[99]')).toBeUndefined();
      });

      it('should return undefined for null/undefined object', () => {
        expect(FieldUtils.nestedGet(null, 'name')).toBeUndefined();
        expect(FieldUtils.nestedGet(undefined, 'name')).toBeUndefined();
      });
    });

    describe('nestedSet', () => {
      it('should set simple property', () => {
        const obj = {};
        FieldUtils.nestedSet(obj, 'name', 'test');
        expect(obj).toEqual({ name: 'test' });
      });

      it('should set nested property', () => {
        const obj: any = {};
        FieldUtils.nestedSet(obj, 'profile.age', 25);
        expect(obj).toEqual({ profile: { age: 25 } });
      });

      it('should set array element', () => {
        const obj: any = {};
        FieldUtils.nestedSet(obj, 'items[0].name', 'item1');
        expect(obj).toEqual({ items: [{ name: 'item1' }] });
      });

      it('should override existing value', () => {
        const obj = { name: 'old' };
        FieldUtils.nestedSet(obj, 'name', 'new');
        expect(obj.name).toBe('new');
      });
    });

    describe('nestedDelete', () => {
      it('should delete simple property', () => {
        const obj = { name: 'test', id: '1' };
        FieldUtils.nestedDelete(obj, 'name');
        expect(obj).toEqual({ id: '1' });
      });

      it('should delete nested property', () => {
        const obj = { profile: { age: 25, name: 'test' } };
        FieldUtils.nestedDelete(obj, 'profile.age');
        expect(obj).toEqual({ profile: { name: 'test' } });
      });

      it('should delete array element', () => {
        const obj = { tags: ['a', 'b', 'c'] };
        FieldUtils.nestedDelete(obj, 'tags[1]');
        expect(obj.tags).toEqual(['a', 'c']);
      });
    });

    describe('pick', () => {
      it('should pick specified keys', () => {
        const result = FieldUtils.pick(testObj, ['id', 'name']);
        expect(result).toEqual({ id: '1', name: 'test' });
      });

      it('should ignore non-existent keys', () => {
        const result = FieldUtils.pick(testObj, ['id', 'nonExistent'] as any);
        expect(result).toEqual({ id: '1' });
      });
    });

    describe('omit', () => {
      it('should omit specified keys', () => {
        const result = FieldUtils.omit(testObj, ['password', 'email']) as any;
        expect(result.password).toBeUndefined();
        expect(result.email).toBeUndefined();
        expect(result.id).toBe('1');
        expect(result.name).toBe('test');
      });
    });

    describe('mapFields', () => {
      it('should map fields with simple mapping', () => {
        const result = FieldUtils.mapFields<any>(testObj, {
          userId: 'id',
          userName: 'name',
        });
        expect(result.userId).toBe('1');
        expect(result.userName).toBe('test');
      });

      it('should map nested fields', () => {
        const result = FieldUtils.mapFields<any>(testObj, {
          userAge: 'profile.age',
          city: 'profile.address.city',
        });
        expect(result.userAge).toBe(25);
        expect(result.city).toBe('Beijing');
      });

      it('should map array fields', () => {
        const result = FieldUtils.mapFields<any>(testObj, {
          firstTag: 'tags[0]',
          firstItemName: 'items[0].name',
        });
        expect(result.firstTag).toBe('a');
        expect(result.firstItemName).toBe('item1');
      });

      it('should remove original when removeOriginal is true', () => {
        const result = FieldUtils.mapFields<any>(
          { id: '1', name: 'test' },
          { userId: 'id' },
          true,
        );
        expect(result.userId).toBe('1');
        expect(result.id).toBeUndefined();
      });
    });
  });

  describe('UrlUtils', () => {
    describe('buildQueryString', () => {
      it('should build query string from params', () => {
        const params = { page: 1, pageSize: 10, keyword: 'test' };
        const result = UrlUtils.buildQueryString(params);
        expect(result).toContain('page=1');
        expect(result).toContain('pageSize=10');
        expect(result).toContain('keyword=test');
      });

      it('should skip undefined/null/empty values', () => {
        const params = { a: 1, b: undefined, c: null, d: '' };
        const result = UrlUtils.buildQueryString(params);
        expect(result).toBe('a=1');
      });

      it('should return empty string for empty params', () => {
        expect(UrlUtils.buildQueryString({})).toBe('');
      });
    });

    describe('appendQuery', () => {
      it('should append query to url without query', () => {
        const result = UrlUtils.appendQuery('/api/users', { page: 1 });
        expect(result).toBe('/api/users?page=1');
      });

      it('should append query to url with existing query', () => {
        const result = UrlUtils.appendQuery('/api/users?a=1', { b: 2 });
        expect(result).toBe('/api/users?a=1&b=2');
      });

      it('should return original url if no params', () => {
        const result = UrlUtils.appendQuery('/api/users', {});
        expect(result).toBe('/api/users');
      });
    });
  });
});
