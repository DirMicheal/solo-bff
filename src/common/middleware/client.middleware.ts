import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClientType } from '../enums/index.enum';

declare global {
  namespace Express {
    interface Request {
      clientType: ClientType;
      clientVersion?: string;
    }
  }
}

@Injectable()
export class ClientMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || '';
    const clientHeader = req.headers['x-client-type'] as string;
    const versionHeader = req.headers['x-client-version'] as string;

    let clientType: ClientType;

    if (clientHeader) {
      clientType = clientHeader as ClientType;
    } else if (/miniProgram|miniprogram|MicroMessenger/i.test(userAgent)) {
      clientType = ClientType.MINI_PROGRAM;
    } else if (/Android|iPhone|iPad|iPod/i.test(userAgent)) {
      if (/Mobile/i.test(userAgent)) {
        clientType = ClientType.H5;
      } else {
        clientType = ClientType.APP;
      }
    } else {
      clientType = ClientType.PC;
    }

    req.clientType = clientType;
    req.clientVersion = versionHeader;

    next();
  }
}
