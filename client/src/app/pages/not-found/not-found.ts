import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center space-y-4">
      <h1 class="text-6xl font-bold text-indigo-500">404</h1>
      <h2 class="text-2xl font-medium text-slate-200">Page Not Found</h2>
      <p class="text-slate-400 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
      <a routerLink="/dashboard" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
        Return to Dashboard
      </a>
    </div>
  `
})
export class NotFound {}
