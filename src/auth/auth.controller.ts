// auth/auth.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OwnerLoginDto } from './dto/owner-login.dto';
import { Public } from './decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0];
    }
    return req.ip ?? '';
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login for all users (Facility Admin, Branch Admin, Staff)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      this.getClientIp(req),
    );
  }

  @Public()
  @Post('owner/login')
  @ApiOperation({ summary: 'Login for Owner only' })
  @ApiResponse({ status: 200, description: 'Owner login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginOwner(@Body() ownerLoginDto: OwnerLoginDto, @Req() req: Request) {
    return this.authService.login(
      ownerLoginDto.email,
      ownerLoginDto.password,
      this.getClientIp(req),
    );
  }
}