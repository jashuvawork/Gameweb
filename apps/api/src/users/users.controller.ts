import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.users.profile(user.id);
  }

  @Get('me/stats')
  stats(@CurrentUser() user: { id: string }) {
    return this.users.stats(user.id);
  }

  @Get('me/devices')
  devices(@CurrentUser() user: { id: string }) {
    return this.users.devices(user.id);
  }

  @Get('me/login-history')
  loginHistory(@CurrentUser() user: { id: string }) {
    return this.users.loginHistory(user.id);
  }

  @Post('me/daily-reward')
  daily(@CurrentUser() user: { id: string }) {
    return this.users.claimDaily(user.id);
  }

  @Patch('me')
  update(
    @CurrentUser() user: { id: string },
    @Body() body: { displayName?: string; avatarUrl?: string },
  ) {
    return this.users.updateProfile(user.id, body);
  }
}
