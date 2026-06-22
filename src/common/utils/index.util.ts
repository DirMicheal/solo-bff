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
    for (const [target, source] of Object.entries(mapping)) {
      const sourceValue = FieldUtils.nestedGet(obj, source);
      if (sourceValue !== undefined) {
        FieldUtils.nestedSet(result, target, sourceValue);
        if (removeOriginal && source !== target) {
          FieldUtils.nestedDelete(result, source);
        }
      }
    }
    return result as T;
  }

  static parsePath(path: string): string[] {
    const result: string[] = [];
    let current = '';
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === '.') {
        if (current) {
          result.push(current);
          current = '';
        }
        i++;
      } else if (char === '[') {
        if (current) {
          result.push(current);
          current = '';
        }
        const endBracket = path.indexOf(']', i);
        if (endBracket === -1) {
          throw new Error(`Invalid path syntax: missing closing bracket in "${path}"`);
        }
        const indexStr = path.substring(i + 1, endBracket);
        if (indexStr !== '') {
          result.push(indexStr);
        }
        i = endBracket + 1;
      } else {
        current += char;
        i++;
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  static nestedGet(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const keys = FieldUtils.parsePath(path);

    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return undefined;
      }
      if (Array.isArray(result)) {
        const numKey = Number(key);
        if (!isNaN(numKey)) {
          result = result[numKey];
        } else {
          return undefined;
        }
      } else if (typeof result === 'object') {
        result = result[key];
      } else {
        return undefined;
      }
    }

    return result;
  }

  static nestedSet(obj: any, path: string, value: any): void {
    if (!obj || !path) return;

    const keys = FieldUtils.parsePath(path);
    const lastKey = keys.pop()!;

    let current = obj;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const nextKey = i < keys.length - 1 ? keys[i + 1] : lastKey;
      const nextIsArray = /^\d+$/.test(nextKey);

      if (current[key] === undefined || current[key] === null) {
        current[key] = nextIsArray ? [] : {};
      }

      current = current[key];
    }

    const lastIsArray = /^\d+$/.test(lastKey);
    if (Array.isArray(current)) {
      const numKey = Number(lastKey);
      if (!isNaN(numKey)) {
        current[numKey] = value;
      }
    } else if (typeof current === 'object') {
      current[lastKey] = value;
    }
  }

  static nestedDelete(obj: any, path: string): void {
    if (!obj || !path) return;

    const keys = FieldUtils.parsePath(path);
    const lastKey = keys.pop()!;

    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) return;
      current = current[key];
    }

    if (Array.isArray(current)) {
      const numKey = Number(lastKey);
      if (!isNaN(numKey)) {
        current.splice(numKey, 1);
      }
    } else if (typeof current === 'object' && current !== null) {
      delete current[lastKey];
    }
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
