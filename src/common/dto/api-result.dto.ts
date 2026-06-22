import { ErrorCode } from '../enums/index.enum';

export class ApiResult<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;

  constructor(code: number, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
  }

  static success<T>(data: T, message = 'success'): ApiResult<T> {
    return new ApiResult<T>(ErrorCode.SUCCESS, message, data);
  }

  static fail(code: number, message: string, data: any = null): ApiResult {
    return new ApiResult(code, message, data);
  }
}

export class PageResult<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  constructor(list: T[], total: number, page: number, pageSize: number) {
    this.list = list;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}
