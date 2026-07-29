import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get('GOOGLE_CLIENT_ID') || 'disabled.apps.googleusercontent.com';
    const clientSecret = config.get('GOOGLE_CLIENT_SECRET') || 'disabled';
    super({
      clientID,
      clientSecret,
      callbackURL: config.get('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
    if (!config.get('GOOGLE_CLIENT_ID')) {
      this.logger.warn('Google OAuth not configured — set GOOGLE_CLIENT_ID to enable');
    }
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'), undefined);
    done(null, {
      id: profile.id,
      email,
      displayName: profile.displayName,
    });
  }
}
