import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <header>
          <div class="logo">AG</div>
          <h1>{{ isLogin() ? 'Welcome back' : 'Create an account' }}</h1>
          <p class="subtitle">{{ isLogin() ? 'Enter your credentials to continue' : 'Start collaborating with your team today' }}</p>
        </header>

        <div class="success-msg" *ngIf="successMessage()">
          <h3>Account created!</h3>
          <p>{{ successMessage() }}</p>
          <button (click)="successMessage.set(''); toggleMode()" class="secondary-btn">Got it, back to Sign In</button>
        </div>

        <form (ngSubmit)="onSubmit()" *ngIf="!successMessage()">
          <div class="form-group" *ngIf="!isLogin()">
            <label>Full Name</label>
            <input type="text" [(ngModel)]="name" name="name" placeholder="John Doe" required>
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="name@company.com" required>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
          </div>

          <div class="error-msg" *ngIf="errorMessage()">{{ errorMessage() }}</div>

          <button type="submit" class="primary-btn" [disabled]="loading()">
            {{ loading() ? 'Processing...' : (isLogin() ? 'Sign In' : 'Sign Up') }}
          </button>
        </form>

        <footer *ngIf="!successMessage()">
          <p>
            {{ isLogin() ? "Don't have an account?" : "Already have an account?" }}
            <button (click)="toggleMode()" class="link-btn">{{ isLogin() ? 'Sign Up' : 'Sign In' }}</button>
          </p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 24px 24px; }
    .auth-card { background: white; width: 100%; max-width: 400px; padding: 40px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; }
    header { text-align: center; margin-bottom: 32px; }
    .logo { width: 40px; height: 40px; background: #3b82f6; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; margin: 0 auto 16px; font-size: 1.2rem; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 8px; }
    .subtitle { color: #64748b; font-size: 0.9rem; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 6px; }
    input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; transition: all 0.2s; box-sizing: border-box; }
    input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .primary-btn { width: 100%; padding: 14px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; margin-top: 8px; }
    .primary-btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5); }
    .primary-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .success-msg { text-align: center; background: #f0fdf4; border: 1px solid #dcfce7; padding: 24px; border-radius: 16px; margin-bottom: 12px; }
    .success-msg h3 { color: #166534; font-size: 1.1rem; margin-top: 0; }
    .success-msg p { color: #166534; font-size: 0.9rem; line-height: 1.5; margin-bottom: 20px; }
    .secondary-btn { padding: 10px 20px; background: #166534; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .error-msg { color: #dc2626; font-size: 0.8rem; background: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #fee2e2; }
    footer { margin-top: 24px; text-align: center; }
    footer p { color: #64748b; font-size: 0.9rem; margin: 0; }
    .link-btn { background: none; border: none; color: #3b82f6; font-weight: 600; cursor: pointer; padding: 0 4px; }
    .link-btn:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  isLogin = signal(true);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  email = '';
  password = '';
  name = '';

  toggleMode() {
    this.isLogin.update(v => !v);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async onSubmit() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      if (this.isLogin()) {
        await this.auth.signIn(this.email, this.password);
        this.router.navigate(['/boards']);
      } else {
        await this.auth.signUp(this.email, this.password, this.name);
        this.successMessage.set('Please check your email inbox (and spam) for the verification link. Once verified, you can sign in to your account.');
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'An error occurred');
    } finally {
      this.loading.set(false);
    }
  }
}
