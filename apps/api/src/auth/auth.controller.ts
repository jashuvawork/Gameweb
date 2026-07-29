import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Get,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto, TwoFactorCodeDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('jg_refresh', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto, req.ip, req.headers['user-agent']);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, req.ip, req.headers['user-agent']);
    if ('refreshToken' in result) this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('owner-login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async ownerLogin(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    const result = await this.auth.ownerLogin(dto, req.ip, req.headers['user-agent']);
    if ('refreshToken' in result) this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto.refreshToken || (req.signedCookies?.jg_refresh as string);
    const result = await this.auth.refresh(token, req.ip, req.headers['user-agent']);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto.refreshToken || (req.signedCookies?.jg_refresh as string);
    if (token) await this.auth.logout(token);
    res.clearCookie('jg_refresh', { path: '/api/auth' });
    return { ok: true };
  }

  @Post('revoke-all')
  @UseGuards(JwtAuthGuard)
  async revokeAll(@CurrentUser() user: { id: string }) {
    return this.auth.revokeAllSessions(user.id);
  }

  @Get('2fa/setup')
  @UseGuards(JwtAuthGuard)
  setup2fa(@CurrentUser() user: { id: string }) {
    return this.auth.setup2FA(user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  enable2fa(@CurrentUser() user: { id: string }, @Body() dto: TwoFactorCodeDto) {
    return this.auth.enable2FA(user.id, dto.code);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { id: string; email: string; displayName?: string };
    const tokens = await this.auth.handleOAuthLogin('google', profile, req.ip, req.headers['user-agent']);
    this.setRefreshCookie(res, tokens.refreshToken);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    res.redirect(`${appUrl}/auth/callback?accessToken=${tokens.accessToken}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
