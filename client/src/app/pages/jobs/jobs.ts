import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucidePlus, lucideX, lucideSearch, lucideWrench, lucideClock, lucideCircleCheck, lucideCircleDot } from '@ng-icons/lucide';
import { JobService } from '../../core/services/job.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Job } from '../../core/interfaces/job.interface';

type StatusFilter = 'all' | 'pending' | 'in-progress' | 'completed';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HlmButton, HlmInput, HlmLabel, HlmCardImports, HlmIconImports],
  providers: [provideIcons({ lucideTrash2, lucidePlus, lucideX, lucideSearch, lucideWrench, lucideClock, lucideCircleCheck, lucideCircleDot })],
  template: `
    <div class="space-y-6">

      <div class="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">Repair Jobs</h1>
          <p class="text-muted-foreground mt-2">Track work orders from intake to completion.</p>
        </div>
        <button hlmBtn (click)="openModal()">
          <ng-icon hlm name="lucidePlus" size="sm" class="mr-2"></ng-icon>
          Add Job
        </button>
      </div>

      <!-- Metrics -->
      <div class="grid gap-4 grid-cols-3">
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Pending</h3>
            <ng-icon hlm name="lucideCircleDot" size="sm" class="text-warning"></ng-icon>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">{{ countByStatus('pending') }}</div>
          </div>
        </div>
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">In Progress</h3>
            <ng-icon hlm name="lucideClock" size="sm" class="text-primary"></ng-icon>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">{{ countByStatus('in-progress') }}</div>
          </div>
        </div>
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Completed</h3>
            <ng-icon hlm name="lucideCircleCheck" size="sm" class="text-success"></ng-icon>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">{{ countByStatus('completed') }}</div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[240px]">
          <ng-icon hlm name="lucideSearch" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"></ng-icon>
          <input
            hlmInput
            type="search"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
            placeholder="Search by description, vehicle, or customer..."
            class="pl-9 bg-card border-border"
          />
        </div>
        <div class="flex items-center gap-1 bg-card border border-border rounded-md p-1">
          <button
            *ngFor="let f of statusFilters"
            type="button"
            (click)="statusFilter.set(f.value)"
            class="px-3 py-1 text-xs rounded transition-colors"
            [ngClass]="statusFilter() === f.value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-card/40 border border-border/60 rounded-lg overflow-hidden">

        <div *ngIf="loading" class="text-muted-foreground text-sm p-8 text-center">Loading jobs...</div>
        <div *ngIf="!loading && loadError" class="text-destructive text-sm p-8 text-center">
          Failed to load jobs: {{ loadError }}
        </div>
        <div *ngIf="!loading && !loadError && filtered().length === 0" class="text-muted-foreground text-sm p-12 text-center">
          No jobs match the current filters.
        </div>

        <table *ngIf="!loading && !loadError && filtered().length > 0" class="w-full text-sm">
          <thead>
            <tr class="border-b border-border/40 bg-muted/20">
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th class="h-11 px-4 text-right align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Est.</th>
              <th class="h-11 px-4 text-right align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Actual</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              <th class="h-11 px-3 w-[1%] text-right"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of filtered()" class="border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/30 group">
              <td class="p-4 align-middle">
                <div class="flex items-center gap-3">
                  <span class="w-1 h-8 rounded-full shrink-0"
                        [ngClass]="{
                          'bg-warning': job.status === 'pending',
                          'bg-primary': job.status === 'in-progress',
                          'bg-success': job.status === 'completed'
                        }"></span>
                  <span class="font-medium text-foreground">{{ job.description }}</span>
                </div>
              </td>
              <td class="p-4 align-middle text-muted-foreground">{{ vehicleLabel(job) }}</td>
              <td class="p-4 align-middle text-muted-foreground">{{ customerLabel(job) }}</td>
              <td class="p-4 align-middle">
                <select
                  [value]="job.status"
                  (change)="updateStatus(job, $any($event.target).value)"
                  class="bg-transparent border border-border rounded-md py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  [ngClass]="{
                    'text-warning': job.status === 'pending',
                    'text-primary': job.status === 'in-progress',
                    'text-success': job.status === 'completed'
                  }">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td class="p-4 align-middle text-right text-foreground tabular-nums">\${{ job.estimatedCost | number:'1.0-0' }}</td>
              <td class="p-4 align-middle text-right tabular-nums" [ngClass]="job.actualCost ? 'text-foreground' : 'text-muted-foreground'">
                {{ job.actualCost ? '$' + (job.actualCost | number:'1.0-0') : '—' }}
              </td>
              <td class="p-4 align-middle text-muted-foreground">{{ job.createdAt ? (job.createdAt | date:'mediumDate') : '—' }}</td>
              <td class="p-3 align-middle text-right">
                <button type="button"
                        class="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        (click)="deleteJob(job._id!)" aria-label="Delete">
                  <ng-icon hlm name="lucideTrash2" size="sm"></ng-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div hlmCard class="bg-card border-border w-full max-w-lg shadow-xl">
          <div hlmCardHeader class="flex flex-row items-center justify-between">
            <h3 hlmCardTitle>Add New Job</h3>
            <button class="text-muted-foreground hover:text-foreground" (click)="closeModal()">
              <ng-icon hlm name="lucideX" size="sm"></ng-icon>
            </button>
          </div>
          <div hlmCardContent>
            <form [formGroup]="jobForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="space-y-1.5">
                <label hlmLabel for="vehicle">Vehicle</label>
                <select id="vehicle" formControlName="vehicle" class="w-full bg-background border border-border text-foreground rounded-md py-2 px-3 text-sm">
                  <option value="" disabled>Select a vehicle</option>
                  <option *ngFor="let v of vehicles()" [value]="v._id">
                    {{ v.year }} {{ v.make }} {{ v.model }} <span *ngIf="v.customer?.name">({{ v.customer.name }})</span>
                  </option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label hlmLabel for="description">Description</label>
                <textarea id="description" formControlName="description" rows="3"
                          placeholder="Oil change, brake service, ..."
                          class="w-full bg-background border border-border text-foreground rounded-md py-2 px-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label hlmLabel for="estimatedCost">Estimated ($)</label>
                  <input hlmInput id="estimatedCost" type="number" formControlName="estimatedCost" placeholder="100" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label hlmLabel for="status">Status</label>
                  <select id="status" formControlName="status" class="w-full bg-background border border-border text-foreground rounded-md py-2 px-3 text-sm">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button hlmBtn variant="outline" type="button" (click)="closeModal()">Cancel</button>
                <button hlmBtn type="submit" [disabled]="jobForm.invalid">Save Job</button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  `
})
export class Jobs implements OnInit {
  loading = true;
  loadError: string | null = null;
  isModalOpen = false;
  jobForm: FormGroup;

  jobs = signal<Job[]>([]);
  vehicles = signal<any[]>([]);
  search = signal('');
  statusFilter = signal<StatusFilter>('all');

  statusFilters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' }
  ];

  filtered = computed<Job[]>(() => {
    const q = this.search().toLowerCase().trim();
    const sf = this.statusFilter();
    return this.jobs().filter(j => {
      if (sf !== 'all' && j.status !== sf) return false;
      if (!q) return true;
      return j.description.toLowerCase().includes(q)
        || this.vehicleLabel(j).toLowerCase().includes(q)
        || this.customerLabel(j).toLowerCase().includes(q);
    });
  });

  constructor(
    private jobService: JobService,
    private vehicleService: VehicleService,
    private fb: FormBuilder
  ) {
    this.jobForm = this.fb.group({
      vehicle: ['', Validators.required],
      description: ['', Validators.required],
      status: ['pending'],
      estimatedCost: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.loadError = null;
    const fail = (err: any) => {
      console.error(err);
      this.loadError = err?.error?.error || err?.message || 'Could not reach the API';
      this.loading = false;
    };
    this.vehicleService.getVehicles().subscribe({
      next: (vData) => {
        this.vehicles.set(vData);
        this.jobService.getJobs().subscribe({
          next: (jData) => {
            this.jobs.set(jData);
            this.loading = false;
          },
          error: fail
        });
      },
      error: fail
    });
  }

  countByStatus(status: 'pending' | 'in-progress' | 'completed'): number {
    return this.jobs().filter(j => j.status === status).length;
  }

  vehicleLabel(job: Job): string {
    const v: any = job.vehicle;
    if (!v || typeof v === 'string') return 'Unknown vehicle';
    return `${v.year} ${v.make} ${v.model}`;
  }

  customerLabel(job: Job): string {
    const v: any = job.vehicle;
    return v?.customer?.name || '—';
  }

  updateStatus(job: Job, newStatus: string) {
    const updated = { ...job, status: newStatus as any };
    this.jobService.updateJob(job._id!, updated).subscribe(saved => {
      this.jobs.update(list => list.map(j => j._id === saved._id ? { ...j, ...saved } : j));
    });
  }

  openModal() { this.jobForm.reset({ status: 'pending' }); this.isModalOpen = true; }
  closeModal() { this.isModalOpen = false; this.jobForm.reset({ status: 'pending' }); }

  onSubmit() {
    if (this.jobForm.invalid) return;
    this.jobService.createJob(this.jobForm.value).subscribe(() => {
      this.loadData();
      this.closeModal();
    });
  }

  deleteJob(id: string) {
    if (!confirm('Delete this job?')) return;
    this.jobService.deleteJob(id).subscribe(() => {
      this.jobs.update(list => list.filter(j => j._id !== id));
    });
  }
}
