import { Injectable, signal, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase: SupabaseClient;
    private _currentUser = new BehaviorSubject<User | null>(null);

    public user$ = this._currentUser.asObservable();
    private router = inject(Router);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        // Initial session check
        this.supabase.auth.getSession().then(({ data }) => {
            this._currentUser.next(data.session?.user ?? null);
        });

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth Event:', event);
            this._currentUser.next(session?.user ?? null);
            if (event === 'SIGNED_OUT') {
                this.router.navigate(['/login']);
            }
        });
    }

    get currentUser() {
        return this._currentUser.value;
    }

    async signUp(email: string, password: string, name: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
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
