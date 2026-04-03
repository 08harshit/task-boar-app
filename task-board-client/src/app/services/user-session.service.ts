import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export interface UserSession {
    id: string;
    name: string;
    color: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserSessionService {
    private auth = inject(AuthService);

    // Colors for presence avatars
    private colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Signal for the current session user (reactive)
    private _user = signal<UserSession | null>(null);

    user = computed(() => {
        const supabaseUser = this.auth.currentUser;
        if (!supabaseUser) return { id: 'guest', name: 'Guest', color: '#94a3b8' };

        return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.['full_name'] || supabaseUser.email || 'Anonymous',
            color: this.getUserColor(supabaseUser.id)
        };
    });

    private getUserColor(id: string): string {
        const index = id.charCodeAt(0) % this.colors.length;
        return this.colors[index];
    }
}
