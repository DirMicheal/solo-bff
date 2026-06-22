import { Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { UserBffService } from './user-bff.service';
import { BffController } from '@/core/base/bff-base.controller';
import { ClientInfo,
  SkipAuth,
  CurrentUser,
} from '@/common/decorators/index.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ClientType } from '@/common/enums/index.enum';

@BffController('users', { auth: true })
export class UserBffController {
  constructor(private readonly userBffService: UserBffService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.userBffService.getUserInfo(user.userId);
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @ClientInfo('clientType') clientType: ClientType) {
    const userData = await this.userBffService.getUserInfo(id);
    return this.userBffService.adaptForClient(userData, clientType);
  }

  @Get()
  async getUsers(@Query() pagination: PaginationDto) {
    return this.userBffService.getUserList(pagination);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.userBffService.updateUser(id, data);
  }
}
