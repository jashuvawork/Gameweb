import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { REQUIRE_2FA_KEY } from './require-2fa.decorator';

/**
 * Zero-trust: SUPER_OWNER owner APIs require 2FA enabled.
 * In development, allow if TWO_FACTOR_ENFORCE=false.
 */
@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    if (process.env.TWO_FACTOR_ENFORCE === 'false') return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();
    if (user.role === Role.SUPER_OWNER && !user.twoFactorEnabled) {
      // First-login grace: allow setup endpoints only via auth controller.
      // Owner APIs require 2FA in production.
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('2FA required for SUPER_OWNER');
      }
    }
    return true;
  }
}
