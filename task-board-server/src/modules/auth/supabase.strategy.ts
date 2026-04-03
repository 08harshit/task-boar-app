import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('SUPABASE_ANON_KEY'), // JWT secret if shared, or use the public key
        });
    }

    async validate(payload: any) {
        // Passport attaches this validated payload to the request as 'user'
        return { id: payload.sub, email: payload.email, ...payload.user_metadata };
    }
}
