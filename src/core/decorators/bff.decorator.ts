import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ClientType } from '@/common/enums/index.enum';

export const BFF_ENDPOINT = 'bff_endpoint';
export const BFF_MODULE = 'bff_module';

export interface BffEndpointOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path?: string;
  service?: string;
  servicePath?: string;
  cache?: {
    ttl?: number;
    key?: string;
  };
  auth?: boolean;
  paginated?: boolean;
  fieldAdapter?: any;
  clientTypes?: ClientType[];
}

export function BffEndpoint(options: BffEndpointOptions = {}): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const method = options.method || 'GET';
    const path = options.path || String(propertyKey);

    SetMetadata(BFF_ENDPOINT, {
      ...options,
      method,
      path,
      handlerName: propertyKey,
    })(target, propertyKey, descriptor);

    return descriptor;
  };
}

export interface BffModuleDecoratorOptions {
  name: string;
  prefix?: string;
  services?: Array<{ name: string; baseURL: string }>;
}

export function BffModule(options: BffModuleDecoratorOptions): ClassDecorator {
  return (target: any) => {
    SetMetadata(BFF_MODULE, options)(target);
    return target;
  };
}

export function BffGet(options: Omit<BffEndpointOptions, 'method'> = {}): MethodDecorator {
  return BffEndpoint({ ...options, method: 'GET' });
}

export function BffPost(options: Omit<BffEndpointOptions, 'method'> = {}): MethodDecorator {
  return BffEndpoint({ ...options, method: 'POST' });
}

export function BffPut(options: Omit<BffEndpointOptions, 'method'> = {}): MethodDecorator {
  return BffEndpoint({ ...options, method: 'PUT' });
}

export function BffDelete(options: Omit<BffEndpointOptions, 'method'> = {}): MethodDecorator {
  return BffEndpoint({ ...options, method: 'DELETE' });
}
