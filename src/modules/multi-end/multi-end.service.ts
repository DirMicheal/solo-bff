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
    if (!config) {
      this.logger.warn(`MultiEnd config is undefined or null`);
      return undefined;
    }

    if (config[clientType] !== undefined) {
      this.logger.debug(`Found config for client type: ${clientType}`);
      return config[clientType];
    }

    if (config.default !== undefined) {
      this.logger.debug(`Using default config for client type: ${clientType}`);
      return config.default;
    }

    this.logger.warn(
      `No config found for client type '${clientType}' and no default provided. ` +
      `Available client types in config: ${Object.keys(config).join(', ')}`,
    );
    return undefined;
  }

  adaptDataByClient(
    data: any,
    fieldAdapters: MultiEndConfig<FieldAdapterConfig>,
    clientType: ClientType,
    adapterService: any,
  ): any {
    if (!fieldAdapters) {
      this.logger.warn(
        `Multi-end field adapters are undefined. ` +
        `Skipping adaptation for client type '${clientType}'. Data returned as-is.`,
      );
      return data;
    }

    const adapterConfig = this.getValue(fieldAdapters, clientType);
    if (!adapterConfig) {
      this.logger.warn(
        `No field adapter config found for client type '${clientType}'. ` +
        `Data returned as-is. Available keys: ${Object.keys(fieldAdapters).join(', ')}`,
      );
      return data;
    }

    if (!adapterService || typeof adapterService.adaptFields !== 'function') {
      this.logger.error(
        `Invalid adapterService provided. Missing 'adaptFields' method. Data returned as-is.`,
      );
      return data;
    }

    this.logger.debug(
      `Applying field adapter for client type '${clientType}'. ` +
      `Config: include=${JSON.stringify(adapterConfig.include)}, ` +
      `exclude=${JSON.stringify(adapterConfig.exclude)}, ` +
      `mappingKeys=${adapterConfig.mappings ? Object.keys(adapterConfig.mappings).join(',') : 'none'}`,
    );

    try {
      const result = adapterService.adaptFields(data, adapterConfig, clientType);
      this.logger.debug(
        `Field adaptation successful for client '${clientType}'. ` +
        `Input keys: ${Object.keys(data || {}).join(',')}. ` +
        `Output keys: ${Object.keys(result || {}).join(',')}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(
        `Field adaptation failed for client '${clientType}': ${error.message}. ` +
        `Falling back to original data.`,
        error.stack,
      );
      return data;
    }
  }

  registerAdapter(endpoint: string, config: EndpointAdapterConfig): void {
    this.adapters.set(endpoint, config);
    this.logger.log(
      `Multi-end adapter registered for endpoint: ${endpoint}. ` +
      `Registered adapters count: ${this.adapters.size}`,
    );
  }

  getAdapter(endpoint: string): EndpointAdapterConfig | undefined {
    const adapter = this.adapters.get(endpoint);
    if (!adapter) {
      this.logger.debug(
        `No adapter found for endpoint: ${endpoint}. ` +
        `Available endpoints: ${Array.from(this.adapters.keys()).join(', ')}`,
      );
    }
    return adapter;
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
