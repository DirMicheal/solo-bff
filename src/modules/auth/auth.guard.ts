import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SKIP_AUTH_KEY, CLIENT_TYPES_KEY } from '@/common/decorators/index.decorator';
import { ClientType } from '@/common/enums/index.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipAuth = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const allowedClientTypes = this.reflector.getAllAndOverride<ClientType[]>(
      CLIENT_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowedClientTypes && allowedClientTypes.length > 0) {
      const clientType = request.clientType;
      if (!allowedClientTypes.includes(clientType)) {
        throw new UnauthorizedException(
          `Client type '${clientType}' is not allowed`,
        );
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
