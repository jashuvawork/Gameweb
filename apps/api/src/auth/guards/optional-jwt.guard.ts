import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error | null, user: T): T | null {
    if (err || !user) return null;
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean> | boolean;
  }
}
