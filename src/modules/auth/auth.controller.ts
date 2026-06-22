import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SkipAuth } from '@/common/decorators/index.decorator';
import { CurrentUser } from '@/common/decorators/param.decorator';
import { Request } from 'express';
import { ClientType } from '@/common/enums/index.enum';

class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @SkipAuth()
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const token = await this.authService.generateToken({
      userId: '1',
      username: body.username,
      clientType: req.clientType,
      roles: ['user'],
    });

    return {
      token,
      user: {
        id: '1',
        username: body.username,
        clientType: req.clientType,
      },
    };
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const newToken = await this.authService.refreshToken(token);
    return { token: newToken };
  }
}
