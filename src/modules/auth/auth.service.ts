import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientType } from '@/common/enums/index.enum';

export interface JwtPayload {
  userId: string;
  username: string;
  clientType: ClientType;
  roles?: string[];
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async generateToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    });
  }

  async decodeToken(token: string): Promise<JwtPayload> {
    return this.jwtService.decode(token) as JwtPayload;
  }

  async refreshToken(oldToken: string): Promise<string> {
    const payload = await this.verifyToken(oldToken);
    const { iat, exp, ...rest } = payload as any;
    return this.generateToken(rest as JwtPayload);
  }
}
