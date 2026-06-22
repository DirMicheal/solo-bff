import { Injectable, Logger } from '@nestjs/common';
import { FieldUtils } from '@/common/utils/index.util';
import { ClientType } from '@/common/enums/index.enum';

export interface FieldMappingRule {
  source?: string;
  target?: string;
  transform?: (value: any, data: any) => any;
  default?: any;
  condition?: (data: any, clientType: ClientType) => boolean;
}

export interface FieldAdapterConfig {
  include?: string[];
  exclude?: string[];
  mappings?: Record<string, FieldMappingRule | string>;
  computed?: Record<string, (data: any) => any>;
}

export interface AggregateSource {
  name: string;
  service?: string;
  path?: string;
  method?: 'GET' | 'POST';
  params?: Record<string, any>;
  data?: any;
  fetcher?: (params?: any) => Promise<any>;
  dependsOn?: string[];
}

export interface AggregateConfig {
  sources: AggregateSource[];
  mergeStrategy?: 'deep' | 'shallow' | 'custom';
  mergeFn?: (results: Record<string, any>) => any;
  fieldAdapter?: FieldAdapterConfig;
}

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  async aggregate(config: AggregateConfig, params?: any): Promise<any> {
    const results: Record<string, any> = {};
    const sourceMap = new Map<string, AggregateSource>();

    for (const source of config.sources) {
      sourceMap.set(source.name, source);
    }

    const executed = new Set<string>();
    const pending = [...config.sources.map((s) => s.name)];

    while (pending.length > 0) {
      const executable: string[] = [];

      for (const name of pending) {
        const source = sourceMap.get(name)!;
        const deps = source.dependsOn || [];
        const depsMet = deps.every((dep) => executed.has(dep));

        if (depsMet) {
          executable.push(name);
        }
      }

      if (executable.length === 0) {
        throw new Error(
          `Circular dependency detected in aggregation: ${pending.join(', ')}`,
        );
      }

      const promises = executable.map(async (name) => {
        const source = sourceMap.get(name)!;
        try {
          const result = await this.fetchSource(source, results, params);
          results[name] = result;
          executed.add(name);
          this.logger.debug(`Aggregate source ${name} completed`);
        } catch (error: any) {
          this.logger.error(`Aggregate source ${name} failed: ${error.message}`);
          results[name] = null;
        }
      });

      await Promise.all(promises);

      for (const name of executable) {
        const idx = pending.indexOf(name);
        if (idx > -1) pending.splice(idx, 1);
      }
    }

    let mergedResult: any;

    if (config.mergeStrategy === 'custom' && config.mergeFn) {
      mergedResult = config.mergeFn(results);
    } else if (config.mergeStrategy === 'deep') {
      mergedResult = this.deepMerge(
        {},
        ...Object.values(results).filter((v) => v && typeof v === 'object'),
      );
    } else {
      mergedResult = { ...results };
    }

    if (config.fieldAdapter) {
      mergedResult = this.adaptFields(
        mergedResult,
        config.fieldAdapter,
        ClientType.PC,
      );
    }

    return mergedResult;
  }

  private async fetchSource(
    source: AggregateSource,
    results: Record<string, any>,
    params?: any,
  ): Promise<any> {
    if (source.fetcher) {
      const fetcherParams = { ...params, ...results };
      return source.fetcher(fetcherParams);
    }

    throw new Error(
      `Source ${source.name} must provide either a fetcher function or service/path`,
    );
  }

  adaptFields(
    data: any,
    config: FieldAdapterConfig,
    clientType: ClientType,
  ): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.adaptFields(item, config, clientType));
    }

    if (!data || typeof data !== 'object') {
      return data;
    }

    let result = { ...data };

    if (config.include && config.include.length > 0) {
      result = FieldUtils.pick(result, config.include as any[]);
    }

    if (config.exclude && config.exclude.length > 0) {
      result = FieldUtils.omit(result, config.exclude as any[]);
    }

    if (config.mappings) {
      result = this.applyMappings(result, config.mappings, clientType);
    }

    if (config.computed) {
      for (const [key, fn] of Object.entries(config.computed)) {
        result[key] = fn(data);
      }
    }

    return result;
  }

  private applyMappings(
    data: any,
    mappings: Record<string, FieldMappingRule | string>,
    clientType: ClientType,
  ): any {
    const result = { ...data };

    for (const [targetKey, rule] of Object.entries(mappings)) {
      if (typeof rule === 'string') {
        const sourceValue = FieldUtils.nestedGet(data, rule);
        if (sourceValue !== undefined) {
          result[targetKey] = sourceValue;
          if (rule !== targetKey && !rule.includes('.')) {
            delete result[rule];
          }
        }
      } else {
        if (rule.condition && !rule.condition(data, clientType)) {
          continue;
        }

        let value: any;

        if (rule.source) {
          value = FieldUtils.nestedGet(data, rule.source);
        }

        if (value === undefined && rule.default !== undefined) {
          value = rule.default;
        }

        if (rule.transform && value !== undefined) {
          value = rule.transform(value, data);
        }

        if (value !== undefined) {
          const target = rule.target || targetKey;
          FieldUtils.nestedSet(result, target, value);
        }
      }
    }

    return result;
  }

  private deepMerge(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}
