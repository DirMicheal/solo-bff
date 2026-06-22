import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { BffRegistryService } from '../registry/bff-registry.service';
import { GatewayService } from '@/modules/gateway/gateway.service';

@Injectable()
export class BffLoaderService implements OnModuleInit {
  private readonly logger = new Logger(BffLoaderService.name);

  constructor(
    private discovery: DiscoveryService,
    private metadataScanner: MetadataScanner,
    private registry: BffRegistryService,
    private gatewayService: GatewayService,
  ) {}

  onModuleInit() {
    this.loadBusinessModules();
    this.logger.log('BFF Loader initialized');
  }

  private loadBusinessModules() {
    const controllers = this.discovery.getControllers();

    for (const wrapper of controllers) {
      const instance = wrapper.instance;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);
      if (!prototype) continue;

      const methods = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methods) {
        const method = prototype[methodName];
        if (!method) continue;

        const endpointMeta = Reflect.getMetadata('bff_endpoint', method);
        if (endpointMeta) {
          this.registry.registerEndpoint(endpointMeta, wrapper.name);
        }
      }
    }

    this.logger.log(
      `Loaded ${this.registry.getEndpoints().length} endpoints from business modules`,
    );
  }
}
