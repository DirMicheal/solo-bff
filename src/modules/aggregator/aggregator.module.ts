import { Module, Global } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';

@Global()
@Module({
  providers: [AggregatorService],
  exports: [AggregatorService],
})
export class AggregatorModule {}
