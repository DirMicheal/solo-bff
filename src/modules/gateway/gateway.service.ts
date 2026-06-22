import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ServiceName } from '@/common/enums/index.enum';
import { ServiceUnavailableException } from '@/common/exceptions/business.exception';

export interface ServiceConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ServiceRequestOptions extends AxiosRequestConfig {
  serviceName: ServiceName | string;
  path: string;
  fallback?: any;
  timeout?: number;
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private services: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.initServices();
  }

  private initServices() {
    const serviceConfigs: Record<string, ServiceConfig> = {
      [ServiceName.USER]: {
        baseURL: process.env.USER_SERVICE_URL || 'http://localhost:3001',
        timeout: 5000,
      },
      [ServiceName.ORDER]: {
        baseURL: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
        timeout: 5000,
      },
      [ServiceName.PRODUCT]: {
        baseURL: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
        timeout: 5000,
      },
    };

    for (const [name, config] of Object.entries(serviceConfigs)) {
      this.services.set(
        name,
        axios.create({
          baseURL: config.baseURL,
          timeout: config.timeout || 5000,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
        }),
      );
    }
  }

  getService(serviceName: ServiceName | string): AxiosInstance {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service;
  }

  async request<T = any>(options: ServiceRequestOptions): Promise<T> {
    const { serviceName, path, fallback, timeout, ...axiosConfig } = options;

    try {
      const service = this.getService(serviceName);
      const response: AxiosResponse<T> = await service.request({
        url: path,
        timeout: timeout || 5000,
        ...axiosConfig,
      });

      this.logger.debug(
        `[${serviceName}] ${axiosConfig.method || 'GET'} ${path} - ${response.status}`,
      );

      return this.extractResponseData(response);
    } catch (error: any) {
      this.logger.error(
        `[${serviceName}] ${axiosConfig.method || 'GET'} ${path} failed: ${error.message}`,
      );

      if (fallback !== undefined) {
        this.logger.warn(`Using fallback for ${serviceName}:${path}`);
        return fallback;
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableException(serviceName as string);
      }

      throw error;
    }
  }

  private extractResponseData(response: AxiosResponse): any {
    const data = response.data;
    if (data && typeof data === 'object' && 'data' in data && 'code' in data) {
      if (data.code === 0 || data.code === 200) {
        return data.data;
      }
      throw new Error(data.message || 'Service error');
    }
    return data;
  }

  async get<T = any>(
    serviceName: ServiceName | string,
    path: string,
    params?: Record<string, any>,
    options?: Partial<ServiceRequestOptions>,
  ): Promise<T> {
    return this.request<T>({
      serviceName,
      path,
      method: 'GET',
      params,
      ...options,
    });
  }

  async post<T = any>(
    serviceName: ServiceName | string,
    path: string,
    data?: any,
    options?: Partial<ServiceRequestOptions>,
  ): Promise<T> {
    return this.request<T>({
      serviceName,
      path,
      method: 'POST',
      data,
      ...options,
    });
  }

  async put<T = any>(
    serviceName: ServiceName | string,
    path: string,
    data?: any,
    options?: Partial<ServiceRequestOptions>,
  ): Promise<T> {
    return this.request<T>({
      serviceName,
      path,
      method: 'PUT',
      data,
      ...options,
    });
  }

  async delete<T = any>(
    serviceName: ServiceName | string,
    path: string,
    options?: Partial<ServiceRequestOptions>,
  ): Promise<T> {
    return this.request<T>({
      serviceName,
      path,
      method: 'DELETE',
      ...options,
    });
  }

  registerService(name: string, config: ServiceConfig): void {
    this.services.set(
      name,
      axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout || 5000,
        headers: config.headers,
      }),
    );
    this.logger.log(`Service ${name} registered`);
  }
}
