import { SetMetadata } from '@nestjs/common';
import { ClientType } from '../enums/index.enum';

export const CLIENT_TYPES_KEY = 'client_types';

export const ClientTypes = (...clientTypes: ClientType[]) =>
  SetMetadata(CLIENT_TYPES_KEY, clientTypes);

export const SKIP_AUTH_KEY = 'skip_auth';

export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const Cacheable = (key?: string, ttl?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY, key || propertyKey, descriptor.value);
    if (ttl) {
      Reflect.defineMetadata(CACHE_TTL, ttl, descriptor.value);
    }
    return descriptor;
  };
};

export const FIELD_MAPPING_KEY = 'field_mapping';

export const FieldMapping = (mapping: Record<string, string>) =>
  SetMetadata(FIELD_MAPPING_KEY, mapping);

export const DATA_TRANSFORM_KEY = 'data_transform';

export const DataTransform = (transformFn: (data: any) => any) =>
  SetMetadata(DATA_TRANSFORM_KEY, transformFn);

export { CurrentUser, ClientInfo } from './param.decorator';
