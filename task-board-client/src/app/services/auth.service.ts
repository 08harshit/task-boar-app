import { Injectable, signal, computed, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase: SupabaseClient;
    private router = inject(Router);

    // Core Auth State Signal
    private _currentUser = signal<User | null>(null);

    // Publicly exposed readonly signals
    public user = computed(() => this._currentUser());
    public isAuthenticated = computed(() => !!this._currentUser());

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        // Initial check
        this.supabase.auth.getSession().then(({ data }) => {
            this._currentUser.set(data.session?.user ?? null);
        });

        // Subscriptions
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth Signal Change:', event);
            this._currentUser.set(session?.user ?? null);
            if (event === 'SIGNED_OUT') {
                this.router.navigate(['/login']);
            }
        });
    }

    get currentUser() {
        return this._currentUser();
    }

    async signUp(email: string, password: string, name: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });
        if (error) throw error;
        return data;
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    getAccessToken() {
        return this.supabase.auth.getSession().then(({ data }) => data.session?.access_token);
    }
}
