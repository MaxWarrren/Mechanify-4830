import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideUsers, lucideCar, lucideWrench, lucideTrendingUp } from '@ng-icons/lucide';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { JobService } from '../../core/services/job.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HlmCardImports,
    HlmIconImports
  ],
  providers: [provideIcons({ lucideUsers, lucideCar, lucideWrench, lucideTrendingUp })],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p class="text-muted-foreground mt-2">Overview of your shop's performance.</p>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Metric Cards -->
        <div hlmCard class="bg-card/80 border-border/60 backdrop-blur-sm hover:border-primary/50 transition-colors shadow-sm">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Total Customers</h3>
            <div class="p-2 bg-primary/10 rounded-lg">
              <ng-icon hlm name="lucideUsers" class="h-4 w-4 text-primary"></ng-icon>
            </div>
          </div>
          <div hlmCardContent>
            <div class="text-3xl font-bold text-foreground">{{ customerCount }}</div>
            <p class="text-xs text-success font-medium flex items-center mt-1">
              <ng-icon hlm name="lucideTrendingUp" class="h-3 w-3 mr-1"></ng-icon>
              +2% from last month
            </p>
          </div>
        </div>

        <div hlmCard class="bg-card/80 border-border/60 backdrop-blur-sm hover:border-primary/50 transition-colors shadow-sm">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Total Vehicles</h3>
            <div class="p-2 bg-success/10 rounded-lg">
              <ng-icon hlm name="lucideCar" class="h-4 w-4 text-success"></ng-icon>
            </div>
          </div>
          <div hlmCardContent>
            <div class="text-3xl font-bold text-foreground">{{ vehicleCount }}</div>
            <p class="text-xs text-success font-medium flex items-center mt-1">
              <ng-icon hlm name="lucideTrendingUp" class="h-3 w-3 mr-1"></ng-icon>
              +5% from last month
            </p>
          </div>
        </div>

        <div hlmCard class="bg-card/80 border-border/60 backdrop-blur-sm hover:border-primary/50 transition-colors shadow-sm">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Active Jobs</h3>
            <div class="p-2 bg-warning/10 rounded-lg">
              <ng-icon hlm name="lucideWrench" class="h-4 w-4 text-warning"></ng-icon>
            </div>
          </div>
          <div hlmCardContent>
            <div class="text-3xl font-bold text-foreground">{{ activeJobCount }}</div>
            <p class="text-xs text-muted-foreground font-medium mt-1">Pending or in-progress</p>
          </div>
        </div>

        <div hlmCard class="bg-card/80 border-border/60 backdrop-blur-sm hover:border-primary/50 transition-colors shadow-sm">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <div class="p-2 bg-secondary/10 rounded-lg">
              <ng-icon hlm name="lucideTrendingUp" class="h-4 w-4 text-secondary"></ng-icon>
            </div>
          </div>
          <div hlmCardContent>
            <div class="text-3xl font-bold text-foreground">\${{ totalRevenue }}</div>
            <p class="text-xs text-muted-foreground font-medium mt-1">From completed jobs</p>
          </div>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div hlmCard class="col-span-4 bg-card/80 border-border/60 backdrop-blur-sm shadow-sm">
          <div hlmCardHeader class="border-b border-border/40 pb-4 mb-4">
            <h3 hlmCardTitle>Recent Activity</h3>
            <p hlmCardDescription>Latest jobs in the shop.</p>
          </div>
          <div hlmCardContent>
            <div class="space-y-6">
              <div *ngFor="let job of recentJobs" class="flex items-center group">
                <div class="w-2 h-2 rounded-full mr-4 shrink-0"
                     [ngClass]="{
                       'bg-warning': job.status === 'pending',
                       'bg-primary': job.status === 'in-progress',
                       'bg-success': job.status === 'completed'
                     }">
                </div>
                <div class="space-y-1 flex-1">
                  <p class="text-sm font-medium leading-none text-foreground group-hover:text-primary transition-colors cursor-pointer">{{ job.description }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ job.vehicle?.make }} {{ job.vehicle?.model }} - 
                    <span [ngClass]="{
                      'text-warning font-medium': job.status === 'pending',
                      'text-primary font-medium': job.status === 'in-progress',
                      'text-success font-medium': job.status === 'completed'
                    }">{{ job.status | titlecase }}</span>
                  </p>
                </div>
                <div class="ml-auto font-medium text-foreground">+\${{ job.estimatedCost }}</div>
              </div>
              <div *ngIf="recentJobs.length === 0" class="text-sm text-muted-foreground italic flex flex-col items-center py-6">
                <ng-icon hlm name="lucideWrench" size="lg" class="text-muted/50 mb-2"></ng-icon>
                No recent jobs found.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class Dashboard implements OnInit {
  customerCount = 0;
  vehicleCount = 0;
  activeJobCount = 0;
  totalRevenue = 0;
  recentJobs: any[] = [];

  constructor(
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.customerService.getCustomers().subscribe(data => this.customerCount = data.length);
    this.vehicleService.getVehicles().subscribe(data => this.vehicleCount = data.length);
    this.jobService.getJobs().subscribe(data => {
      this.recentJobs = data.slice(0, 5);
      this.activeJobCount = data.filter(j => j.status !== 'completed').length;
      this.totalRevenue = data.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.actualCost || j.estimatedCost), 0);
    });
  }
}
