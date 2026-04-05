import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private client: SupabaseClient;

    constructor(private config: ConfigService) { }

    onModuleInit() {
        const url = this.config.get<string>('SUPABASE_URL')!;
        const key = this.config.get<string>('SUPABASE_ANON_KEY')!;
        this.client = createClient(url, key);
    }

    async verifyToken(token: string) {
        const { data, error } = await this.client.auth.getUser(token);
        if (error || !data.user) {
            throw new UnauthorizedException('Invalid or expired token');
        }
        return data.user;
    }
}
