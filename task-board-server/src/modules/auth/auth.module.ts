import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { SupabaseService } from './supabase.service';
import { SupabaseStrategy } from './supabase.strategy';

@Global()
@Module({
    imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    providers: [SupabaseService, SupabaseStrategy],
    exports: [SupabaseService, PassportModule],
})
export class AuthModule { }
