import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const apiUrl = environment.apiUrl;

    // ONLY intercept calls to our backend API!
    // Supabase manages its own auth headers for its own domain.
    if (!req.url.startsWith(apiUrl)) {
        return next(req);
    }

    return from(auth.getAccessToken()).pipe(
        switchMap(token => {
            if (token) {
                const cloned = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(cloned);
            }
            return next(req);
        })
    );
};
