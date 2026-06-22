import { Get, Param, Query } from '@nestjs/common';
import { ProductBffService } from './product-bff.service';
import { BffController } from '@/core/base/bff-base.controller';
import { ClientInfo, SkipAuth } from '@/common/decorators/index.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ClientType } from '@/common/enums/index.enum';

@BffController('products', { auth: false })
export class ProductBffController {
  constructor(private readonly productBffService: ProductBffService) {}

  @Get('detail/:id')
  async getProductDetail(@Param('id') id: string) {
    return this.productBffService.getProductDetail(id);
  }

  @Get('full/:id')
  async getProductFull(@Param('id') id: string, @ClientInfo('clientType') clientType: ClientType) {
    const product = await this.productBffService.getProductDetailAggregated(id);
    return this.productBffService.adaptProductForClient(product, clientType);
  }

  @Get()
  async getProducts(@Query() pagination: PaginationDto, @Query() filters: any) {
    return this.productBffService.getProductList(pagination, filters);
  }
}
