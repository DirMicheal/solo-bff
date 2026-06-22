import { Injectable, Logger } from '@nestjs/common';
import { ClientType } from '@/common/enums/index.enum';
import { FieldAdapterConfig } from '@/modules/aggregator/aggregator.service';

export interface MultiEndConfig<T = any> {
  [ClientType.PC]?: T;
  [ClientType.MINI_PROGRAM]?: T;
  [ClientType.APP]?: T;
  [ClientType.H5]?: T;
  default?: T;
}

export interface EndpointAdapterConfig {
  fieldAdapters?: MultiEndConfig<FieldAdapterConfig>;
  pageConfigs?: MultiEndConfig<{
    pageSize?: number;
    maxPageSize?: number;
  }>;
  responseTransforms?: MultiEndConfig<(data: any) => any>;
}

@Injectable()
export class MultiEndService {
  private readonly logger = new Logger(MultiEndService.name);
  private adapters: Map<string, EndpointAdapterConfig> = new Map();

  getValue<T>(config: MultiEndConfig<T>, clientType: ClientType): T | undefined {
    if (config[clientType] !== undefined) {
      return config[clientType];
    }
    return config.default;
  }

  adaptDataByClient(
    data: any,
    fieldAdapters: MultiEndConfig<FieldAdapterConfig>,
    clientType: ClientType,
    adapterService: any,
  ): any {
    const adapterConfig = this.getValue(fieldAdapters, clientType);
    if (!adapterConfig) {
      return data;
    }
    return adapterService.adaptFields(data, adapterConfig, clientType);
  }

  registerAdapter(endpoint: string, config: EndpointAdapterConfig): void {
    this.adapters.set(endpoint, config);
    this.logger.log(`Multi-end adapter registered for: ${endpoint}`);
  }

  getAdapter(endpoint: string): EndpointAdapterConfig | undefined {
    return this.adapters.get(endpoint);
  }

  getPageConfig(
    clientType: ClientType,
    customConfig?: MultiEndConfig<{ pageSize?: number; maxPageSize?: number }>,
  ): { pageSize: number; maxPageSize: number } {
    const defaultConfig = {
      [ClientType.PC]: { pageSize: 20, maxPageSize: 100 },
      [ClientType.MINI_PROGRAM]: { pageSize: 10, maxPageSize: 50 },
      [ClientType.APP]: { pageSize: 15, maxPageSize: 50 },
      [ClientType.H5]: { pageSize: 10, maxPageSize: 30 },
      default: { pageSize: 10, maxPageSize: 50 },
    };

    let config = customConfig
      ? this.getValue(customConfig, clientType)
      : undefined;

    if (!config) {
      config = defaultConfig[clientType] || defaultConfig.default;
    }

    return {
      pageSize: config?.pageSize || 10,
      maxPageSize: config?.maxPageSize || 50,
    };
  }
}
