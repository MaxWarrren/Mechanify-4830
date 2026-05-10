import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'customers', loadComponent: () => import('./pages/customers/customers').then(m => m.Customers) },
  { path: 'vehicles', loadComponent: () => import('./pages/vehicles/vehicles').then(m => m.Vehicles) },
  { path: 'vehicles/:id', loadComponent: () => import('./pages/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail) },
  { path: 'jobs', loadComponent: () => import('./pages/jobs/jobs').then(m => m.Jobs) },
  { path: 'chat', loadComponent: () => import('./pages/chat/chat').then(m => m.Chat) },
  { path: 'knowledge-base', loadComponent: () => import('./pages/knowledge-base/knowledge-base').then(m => m.KnowledgeBase) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) }
];
