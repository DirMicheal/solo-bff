import { Controller, Get } from '@nestjs/common';
import { SkipAuth } from '@/common/decorators/index.decorator';

@Controller('health')
export class HealthController {
  @SkipAuth()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
    };
  }

  @SkipAuth()
  @Get('ping')
  ping() {
    return 'pong';
  }
}
