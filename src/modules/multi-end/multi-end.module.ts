import { Module, Global } from '@nestjs/common';
import { MultiEndService } from './multi-end.service';

@Global()
@Module({
  providers: [MultiEndService],
  exports: [MultiEndService],
})
export class MultiEndModule {}
