import { Module } from '@nestjs/common';
import { BffCoreModule } from '@/core/bff-core.module';
import { UserBffModule } from './user/user-bff.module';
import { ProductBffModule } from './product/product-bff.module';
import { OrderBffModule } from './order/order-bff.module';

@Module({
  imports: [
    BffCoreModule.register(),
    UserBffModule,
    ProductBffModule,
    OrderBffModule,
  ],
  exports: [
    UserBffModule,
    ProductBffModule,
    OrderBffModule,
  ],
})
export class BusinessModule {}
