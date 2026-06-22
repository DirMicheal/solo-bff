import { Module } from '@nestjs/common';
import { ProductBffService } from './product-bff.service';
import { ProductBffController } from './product-bff.controller';

@Module({
  controllers: [ProductBffController],
  providers: [ProductBffService],
  exports: [ProductBffService],
})
export class ProductBffModule {}
