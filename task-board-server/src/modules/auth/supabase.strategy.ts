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
            secretOrKey: config.get<string>('SUPABASE_ANON_KEY') as string,
        });
    }

    async validate(payload: any) {
        // Passport attaches this validated payload to the request as 'user'
        return { id: payload.sub, email: payload.email, ...payload.user_metadata };
    }
}
