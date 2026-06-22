import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ErrorCode } from '../enums/index.enum';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter: any;

  constructor() {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW) || 60000;
    const max = Number(process.env.RATE_LIMIT_MAX) || 100;

    this.limiter = rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          code: ErrorCode.RATE_LIMITED,
          message: 'Too many requests, please try again later.',
          data: null,
          timestamp: Date.now(),
        });
      },
      keyGenerator: (req: Request) => {
        return (
          req.headers['x-forwarded-for']?.toString() ||
          req.ip ||
          'unknown'
        );
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
