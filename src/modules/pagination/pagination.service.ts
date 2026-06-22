import { Injectable } from '@nestjs/common';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PageResult } from '@/common/dto/api-result.dto';
import { PaginationUtils } from '@/common/utils/index.util';
import { MultiEndService } from '../multi-end/multi-end.service';
import { ClientType } from '@/common/enums/index.enum';

@Injectable()
export class PaginationService {
  constructor(private multiEndService: MultiEndService) {}

  normalizePagination(
    pagination: PaginationDto,
    clientType: ClientType = ClientType.PC,
  ): { page: number; pageSize: number; skip: number } {
    const pageConfig = this.multiEndService.getPageConfig(clientType);
    const page = Math.max(1, pagination.page || 1);
    let pageSize = pagination.pageSize || pageConfig.pageSize;
    pageSize = Math.min(pageSize, pageConfig.maxPageSize);

    return {
      page,
      pageSize,
      skip: PaginationUtils.getSkip(page, pageSize),
    };
  }

  buildPageResult<T>(
    list: T[],
    total: number,
    page: number,
    pageSize: number,
  ): PageResult<T> {
    return new PageResult<T>(list, total, page, pageSize);
  }

  async paginate<T>(
    fetchFn: (skip: number, limit: number) => Promise<{ list: T[]; total: number }>,
    pagination: PaginationDto,
    clientType?: ClientType,
  ): Promise<PageResult<T>> {
    const { page, pageSize, skip } = this.normalizePagination(
      pagination,
      clientType,
    );
    const { list, total } = await fetchFn(skip, pageSize);
    return this.buildPageResult(list, total, page, pageSize);
  }

  toServiceParams(pagination: PaginationDto, clientType?: ClientType) {
    const { page, pageSize } = this.normalizePagination(
      pagination,
      clientType,
    );
    return {
      page,
      pageSize,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
  }
}
