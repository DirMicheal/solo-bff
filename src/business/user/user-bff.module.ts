import { Module } from '@nestjs/common';
import { UserBffService } from './user-bff.service';
import { UserBffController } from './user-bff.controller';

@Module({
  controllers: [UserBffController],
  providers: [UserBffService],
  exports: [UserBffService],
})
export class UserBffModule {}
