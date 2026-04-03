import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private client: SupabaseClient;

    constructor(private config: ConfigService) { }

    onModuleInit() {
        this.client = createClient(
            this.config.get('SUPABASE_URL'),
            this.config.get('SUPABASE_ANON_KEY'),
        );
    }

    async verifyToken(token: string) {
        const { data, error } = await this.client.auth.getUser(token);
        if (error || !data.user) {
            throw new UnauthorizedException('Invalid or expired token');
        }
        return data.user;
    }
}
