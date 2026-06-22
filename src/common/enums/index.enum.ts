export enum ClientType {
  PC = 'pc',
  MINI_PROGRAM = 'mini_program',
  APP = 'app',
  H5 = 'h5',
}

export enum ServiceName {
  USER = 'user',
  ORDER = 'order',
  PRODUCT = 'product',
  PAYMENT = 'payment',
}

export enum ErrorCode {
  SUCCESS = 0,
  ERROR = -1,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 400,
  RATE_LIMITED = 429,
  SERVICE_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  BUSINESS_ERROR = 1000,
}

export enum CacheKeyPrefix {
  USER = 'user:',
  PRODUCT = 'product:',
  ORDER = 'order:',
  API_RESULT = 'api:result:',
}
