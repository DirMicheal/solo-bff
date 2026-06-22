import {
  Controller,
  All,
  Req,
  Res,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GatewayService } from './gateway.service';
import { SkipAuth } from '@/common/decorators/index.decorator';

@Controller('gateway')
export class GatewayController {
  constructor(private gatewayService: GatewayService) {}

  @SkipAuth()
  @All(':service/*')
  async proxy(@Param('service') service: string, @Req() req: Request, @Res() res: Response) {
    const path = req.params[0] || '';
    const fullPath = `/${path}`;

    try {
      const serviceInstance = this.gatewayService.getService(service);
      const response = await serviceInstance.request({
        method: req.method as any,
        url: fullPath,
        params: req.query,
        data: req.body,
        headers: {
          ...req.headers,
          host: undefined,
          'content-length': undefined,
        },
        validateStatus: () => true,
      });

      res.status(response.status);
      const contentType = response.headers['content-type'];
      if (contentType) {
        res.setHeader('content-type', String(contentType));
      }
      res.send(response.data);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          `Service ${service} is unavailable`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }
}
