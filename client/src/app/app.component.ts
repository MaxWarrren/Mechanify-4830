import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideLayoutDashboard, lucideUsers, lucideCar, lucideWrench, lucideMessageSquare, lucideBook } from '@ng-icons/lucide';
import { Observable } from 'rxjs';

const FULL_WIDTH_ROUTES = ['/chat'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HlmButton, HlmIconImports],
  providers: [provideIcons({ lucideLayoutDashboard, lucideUsers, lucideCar, lucideWrench, lucideMessageSquare, lucideBook })],
  template: `
    <div class="min-h-screen bg-background text-foreground flex overflow-hidden selection:bg-primary/30 font-sans">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-background/80 backdrop-blur-xl border-r border-border/60 flex flex-col z-20">
        <div class="h-16 flex items-center px-6 border-b border-border/60">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <ng-icon hlm size="sm" name="lucideWrench" class="text-primary"></ng-icon>
            </div>
            <span class="text-lg font-semibold tracking-tight text-foreground">Mechanify</span>
          </div>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-2">
          <a routerLink="/dashboard" routerLinkActive="bg-primary/10 text-primary border-primary/30" 
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all min-h-[44px]">
            <ng-icon hlm size="sm" name="lucideLayoutDashboard"></ng-icon>
            Dashboard
          </a>
          
          <a routerLink="/customers" routerLinkActive="bg-primary/10 text-primary border-primary/30"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all min-h-[44px]">
            <ng-icon hlm size="sm" name="lucideUsers"></ng-icon>
            Customers
          </a>

          <a routerLink="/vehicles" routerLinkActive="bg-primary/10 text-primary border-primary/30"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all min-h-[44px]">
            <ng-icon hlm size="sm" name="lucideCar"></ng-icon>
            Vehicles
          </a>

          <a routerLink="/jobs" routerLinkActive="bg-primary/10 text-primary border-primary/30"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all min-h-[44px]">
            <ng-icon hlm size="sm" name="lucideWrench"></ng-icon>
            Repair Jobs
          </a>

          <div class="pt-6 pb-2">
            <p class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Assistant</p>
          </div>

          <a routerLink="/chat" routerLinkActive="bg-primary/10 text-primary border-primary/30"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all min-h-[44px]">
            <ng-icon hlm size="sm" name="lucideMessageSquare"></ng-icon>
            Mechanify AI
          </a>

          <a routerLink="/knowledge-base" routerLinkActive="bg-primary/10 text-primary border-primary/30"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent transition-all min-h-[44px]">
            <ng-icon hlm size="sm" name="lucideBook"></ng-icon>
            Knowledge Base
          </a>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col relative min-w-0">
        <!-- Top header -->
        <header class="h-16 flex items-center justify-between px-8 border-b border-border/60 bg-background/80 backdrop-blur-md z-10 sticky top-0">
          <div class="flex items-center gap-4">
            <!-- Breadcrumbs or page title could go here -->
          </div>
          <div class="flex items-center gap-4">
            <div class="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
              <span class="text-xs font-medium text-muted-foreground">AD</span>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <div class="flex-1 overflow-auto">
          <div [ngClass]="(isFullWidth$ | async) ? 'h-full' : 'p-8 max-w-7xl mx-auto h-full'">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>

    </div>
  `
})
export class AppComponent {
  title = 'Mechanify';
  isFullWidth$: Observable<boolean>;

  constructor(private router: Router) {
    this.isFullWidth$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => FULL_WIDTH_ROUTES.some(r => e.urlAfterRedirects.startsWith(r))),
      startWith(FULL_WIDTH_ROUTES.some(r => this.router.url.startsWith(r)))
    );
  }
}
