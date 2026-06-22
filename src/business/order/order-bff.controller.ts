import { Get, Post, Param, Body, Query } from '@nestjs/common';
import { OrderBffService } from './order-bff.service';
import { BffController } from '@/core/base/bff-base.controller';
import { ClientInfo, CurrentUser } from '@/common/decorators/index.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ClientType } from '@/common/enums/index.enum';

@BffController('orders', { auth: true })
export class OrderBffController {
  constructor(private readonly orderBffService: OrderBffService) {}

  @Get('detail/:id')
  async getOrderDetail(@Param('id') id: string) {
    return this.orderBffService.getOrderDetail(id);
  }

  @Get('full/:id')
  async getOrderFull(
    @Param('id') id: string,
    @ClientInfo('clientType') clientType: ClientType,
  ) {
    const order = await this.orderBffService.getOrderDetailFull(id);
    return this.orderBffService.adaptOrderForClient(order, clientType);
  }

  @Get()
  async getOrders(
    @Query() pagination: PaginationDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.orderBffService.getOrderList(pagination, userId);
  }

  @Post()
  async createOrder(@Body() orderData: any) {
    return this.orderBffService.createOrder(orderData);
  }
}
