import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Convert the current user signal to an observable for the router guard
    return toObservable(auth.user).pipe(
        take(1),
        map(user => {
            if (user) return true;
            router.navigate(['/login']);
            return false;
        })
    );
};
