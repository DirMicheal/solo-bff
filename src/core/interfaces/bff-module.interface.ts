import { Type, DynamicModule } from '@nestjs/common';

export interface BffModuleOptions {
  prefix?: string;
  services?: ServiceRegistration[];
  endpoints?: EndpointRegistration[];
}

export interface ServiceRegistration {
  name: string;
  baseURL: string;
  timeout?: number;
}

export interface EndpointRegistration {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler?: Type<any> | string;
  service?: string;
  servicePath?: string;
  cache?: {
    ttl?: number;
    key?: string;
  };
  auth?: boolean;
  rateLimit?: {
    windowMs?: number;
    max?: number;
  };
  fieldAdapter?: any;
  multiEnd?: boolean;
  paginated?: boolean;
}

export interface BffBusinessModule {
  register(options?: BffModuleOptions): DynamicModule;
}
