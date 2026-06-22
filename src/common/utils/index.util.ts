export class PaginationUtils {
  static getSkip(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  static getTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  }

  static buildPaginationParams(page: number, pageSize: number) {
    return {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      skip: PaginationUtils.getSkip(
        Number(page) || 1,
        Number(pageSize) || 10,
      ),
    };
  }
}

export class FieldUtils {
  static pick<T extends object, K extends keyof T>(
    obj: T,
    keys: K[],
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (obj && key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  static omit<T extends object, K extends keyof T>(
    obj: T,
    keys: K[],
  ): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  }

  static mapFields<T>(
    obj: any,
    mapping: Record<string, string>,
    removeOriginal = false,
  ): T {
    const result = { ...obj };
    for (const [source, target] of Object.entries(mapping)) {
      if (source in result) {
        result[target] = result[source];
        if (removeOriginal) {
          delete result[source];
        }
      }
    }
    return result as T;
  }

  static nestedGet(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  static nestedSet(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((acc, key) => {
      if (!acc[key]) acc[key] = {};
      return acc[key];
    }, obj);
    target[lastKey] = value;
  }
}

export class UrlUtils {
  static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  }

  static appendQuery(url: string, params: Record<string, any>): string {
    const queryString = UrlUtils.buildQueryString(params);
    if (!queryString) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${queryString}`;
  }
}
