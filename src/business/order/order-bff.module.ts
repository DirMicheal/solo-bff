import { Module } from '@nestjs/common';
import { OrderBffService } from './order-bff.service';
import { OrderBffController } from './order-bff.controller';

@Module({
  controllers: [OrderBffController],
  providers: [OrderBffService],
  exports: [OrderBffService],
})
export class OrderBffModule {}
