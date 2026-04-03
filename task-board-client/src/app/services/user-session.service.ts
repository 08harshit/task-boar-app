import { Injectable, signal } from '@angular/core';

export interface UserSession {
    id: string;
    name: string;
    color: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserSessionService {
    private readonly SESSION_KEY = 'task_board_user_session';

    user = signal<UserSession>({ id: '', name: '', color: '' });

    constructor() {
        this.restoreOrInitSession();
    }

    private restoreOrInitSession() {
        const stored = localStorage.getItem(this.SESSION_KEY);
        if (stored) {
            this.user.set(JSON.parse(stored));
        } else {
            const newUser = {
                id: crypto.randomUUID(),
                name: `User_${Math.floor(Math.random() * 1000)}`,
                color: this.getRandomColor()
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(newUser));
            this.user.set(newUser);
        }
    }

    private getRandomColor(): string {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateProfile(name: string) {
        const current = this.user();
        const updated = { ...current, name };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
        this.user.set(updated);
    }
}
