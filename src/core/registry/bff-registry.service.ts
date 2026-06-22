import { Injectable, Logger, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { GatewayService } from '@/modules/gateway/gateway.service';
import { ServiceRegistration, EndpointRegistration } from '../interfaces/bff-module.interface';
import { AggregatorService } from '@/modules/aggregator/aggregator.service';
import { MultiEndService } from '@/modules/multi-end/multi-end.service';

@Injectable()
export class BffRegistryService {
  private readonly logger = new Logger(BffRegistryService.name);
  private services: Map<string, ServiceRegistration> = new Map();
  private endpoints: Map<string, EndpointRegistration> = new Map();
  private businessModules: Map<string, Type<any>> = new Map();

  constructor(
    private gatewayService: GatewayService,
    private aggregatorService: AggregatorService,
    private multiEndService: MultiEndService,
    private modulesContainer: ModulesContainer,
  ) {}

  registerService(service: ServiceRegistration): void {
    this.services.set(service.name, service);
    this.gatewayService.registerService(service.name, {
      baseURL: service.baseURL,
      timeout: service.timeout,
    });
    this.logger.log(`Service registered: ${service.name} -> ${service.baseURL}`);
  }

  registerServices(services: ServiceRegistration[]): void {
    services.forEach((s) => this.registerService(s));
  }

  registerEndpoint(endpoint: EndpointRegistration, moduleName?: string): void {
    const key = moduleName ? `${moduleName}:${endpoint.path}` : endpoint.path;
    this.endpoints.set(key, endpoint);
    this.logger.log(
      `Endpoint registered: ${endpoint.method} ${endpoint.path}`,
    );
  }

  registerEndpoints(endpoints: EndpointRegistration[], moduleName?: string): void {
    endpoints.forEach((e) => this.registerEndpoint(e, moduleName));
  }

  registerBusinessModule(name: string, module: Type<any>): void {
    this.businessModules.set(name, module);
    this.logger.log(`Business module registered: ${name}`);
  }

  getServices(): ServiceRegistration[] {
    return Array.from(this.services.values());
  }

  getEndpoints(): EndpointRegistration[] {
    return Array.from(this.endpoints.values());
  }

  getBusinessModules(): Map<string, Type<any>> {
    return this.businessModules;
  }

  getService(name: string): ServiceRegistration | undefined {
    return this.services.get(name);
  }

  getEndpoint(path: string): EndpointRegistration | undefined {
    return this.endpoints.get(path);
  }
}
