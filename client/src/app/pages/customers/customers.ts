import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucidePlus, lucideX, lucideSearch, lucideUsers, lucideUserPlus, lucideTrendingUp, lucideMail, lucidePhone, lucidePencil } from '@ng-icons/lucide';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { JobService } from '../../core/services/job.service';
import { Customer, CustomerStatus } from '../../core/interfaces/customer.interface';
import { Vehicle } from '../../core/interfaces/vehicle.interface';
import { Job } from '../../core/interfaces/job.interface';

type StatusFilter = 'all' | CustomerStatus;

interface CustomerRow {
  customer: Customer;
  vehicleCount: number;
  openJobs: number;
  lifetimeValue: number;
  lastService: Date | null;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HlmButton, HlmInput, HlmLabel, HlmCardImports, HlmIconImports],
  providers: [provideIcons({ lucideTrash2, lucidePlus, lucideX, lucideSearch, lucideUsers, lucideUserPlus, lucideTrendingUp, lucideMail, lucidePhone, lucidePencil })],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p class="text-muted-foreground mt-2">Pipeline for managing shop customers from first inquiry to repeat business.</p>
        </div>
        <button hlmBtn (click)="openCreate()">
          <ng-icon hlm name="lucidePlus" size="sm" class="mr-2"></ng-icon>
          Add Customer
        </button>
      </div>

      <!-- Metrics -->
      <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Total</h3>
            <ng-icon hlm name="lucideUsers" size="sm" class="text-primary"></ng-icon>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">{{ rows().length }}</div>
          </div>
        </div>
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Active</h3>
            <span class="w-2 h-2 rounded-full bg-success"></span>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">{{ countByStatus('active') }}</div>
          </div>
        </div>
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Leads</h3>
            <ng-icon hlm name="lucideUserPlus" size="sm" class="text-warning"></ng-icon>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">{{ countByStatus('lead') }}</div>
          </div>
        </div>
        <div hlmCard class="bg-card/80 border-border/60">
          <div hlmCardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 hlmCardTitle class="text-sm font-medium text-muted-foreground">Lifetime Revenue</h3>
            <ng-icon hlm name="lucideTrendingUp" size="sm" class="text-success"></ng-icon>
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-semibold text-foreground">\${{ totalRevenue() | number:'1.0-0' }}</div>
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
            placeholder="Search by name, email, or phone..."
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

        <div *ngIf="loading" class="text-muted-foreground text-sm p-8 text-center">Loading customers...</div>
        <div *ngIf="!loading && loadError" class="text-destructive text-sm p-8 text-center">
          Failed to load customers: {{ loadError }}
        </div>
        <div *ngIf="!loading && !loadError && filtered().length === 0" class="text-muted-foreground text-sm p-12 text-center">
          No customers match the current filters.
        </div>

        <table *ngIf="!loading && !loadError && filtered().length > 0" class="w-full text-sm">
          <thead>
            <tr class="border-b border-border/40 bg-muted/20">
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicles</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Jobs</th>
              <th class="h-11 px-4 text-right align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Lifetime Value</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Service</th>
              <th class="h-11 px-3 w-[1%] text-right"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered()" class="border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/30 group">
              <td class="p-4 align-middle">
                <div class="font-medium text-foreground">{{ row.customer.name }}</div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  <span class="inline-flex items-center gap-1">
                    <ng-icon hlm name="lucideMail" size="sm"></ng-icon>
                    {{ row.customer.email }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <ng-icon hlm name="lucidePhone" size="sm"></ng-icon>
                    {{ row.customer.phone }}
                  </span>
                </div>
              </td>
              <td class="p-4 align-middle">
                <select
                  [value]="row.customer.status || 'lead'"
                  (change)="onStatusChange(row.customer, $any($event.target).value)"
                  class="bg-transparent border border-border rounded-md py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  [ngClass]="statusTextClass(row.customer.status)">
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="returning">Returning</option>
                  <option value="inactive">Inactive</option>
                </select>
              </td>
              <td class="p-4 align-middle text-foreground">{{ row.vehicleCount }}</td>
              <td class="p-4 align-middle">
                <span *ngIf="row.openJobs > 0" class="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-medium">
                  {{ row.openJobs }}
                </span>
                <span *ngIf="row.openJobs === 0" class="text-muted-foreground">0</span>
              </td>
              <td class="p-4 align-middle text-right text-foreground tabular-nums">
                \${{ row.lifetimeValue | number:'1.0-0' }}
              </td>
              <td class="p-4 align-middle text-muted-foreground">
                {{ row.lastService ? (row.lastService | date:'mediumDate') : '—' }}
              </td>
              <td class="p-3 align-middle text-right">
                <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" class="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60"
                          (click)="openEdit(row.customer)" aria-label="Edit">
                    <ng-icon hlm name="lucidePencil" size="sm"></ng-icon>
                  </button>
                  <button type="button" class="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted/60"
                          (click)="deleteCustomer(row.customer._id!)" aria-label="Delete">
                    <ng-icon hlm name="lucideTrash2" size="sm"></ng-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div hlmCard class="bg-card border-border w-full max-w-md shadow-xl">
          <div hlmCardHeader class="flex flex-row items-center justify-between">
            <h3 hlmCardTitle>{{ editingId ? 'Edit Customer' : 'Add Customer' }}</h3>
            <button class="text-muted-foreground hover:text-foreground" (click)="closeModal()">
              <ng-icon hlm name="lucideX" size="sm"></ng-icon>
            </button>
          </div>
          <div hlmCardContent>
            <form [formGroup]="customerForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="space-y-1.5">
                <label hlmLabel for="name">Full Name</label>
                <input hlmInput id="name" formControlName="name" placeholder="John Doe" class="w-full" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label hlmLabel for="email">Email</label>
                  <input hlmInput id="email" type="email" formControlName="email" placeholder="john@example.com" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label hlmLabel for="phone">Phone</label>
                  <input hlmInput id="phone" formControlName="phone" placeholder="555-0199" class="w-full" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label hlmLabel for="status">Pipeline Stage</label>
                <select id="status" formControlName="status" class="w-full bg-background border border-border text-foreground rounded-md py-2 px-3 text-sm">
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="returning">Returning</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label hlmLabel for="notes">Notes</label>
                <textarea id="notes" formControlName="notes" rows="3"
                          placeholder="Preferences, recent conversations, follow-ups..."
                          class="w-full bg-background border border-border text-foreground rounded-md py-2 px-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button hlmBtn variant="outline" type="button" (click)="closeModal()">Cancel</button>
                <button hlmBtn type="submit" [disabled]="customerForm.invalid">{{ editingId ? 'Save Changes' : 'Save Customer' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  `
})
export class Customers implements OnInit {
  loading = true;
  loadError: string | null = null;
  isModalOpen = false;
  editingId: string | null = null;
  customerForm: FormGroup;

  customers = signal<Customer[]>([]);
  vehicles = signal<Vehicle[]>([]);
  jobs = signal<Job[]>([]);
  search = signal('');
  statusFilter = signal<StatusFilter>('all');

  statusFilters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Leads', value: 'lead' },
    { label: 'Returning', value: 'returning' },
    { label: 'Inactive', value: 'inactive' }
  ];

  rows = computed<CustomerRow[]>(() => {
    const vehiclesByCustomer = new Map<string, Vehicle[]>();
    for (const v of this.vehicles()) {
      const cid = typeof v.customer === 'string' ? v.customer : v.customer?._id;
      if (!cid) continue;
      const arr = vehiclesByCustomer.get(cid) || [];
      arr.push(v);
      vehiclesByCustomer.set(cid, arr);
    }
    return this.customers().map(c => {
      const cVehicles = vehiclesByCustomer.get(c._id!) || [];
      const vehicleIds = new Set(cVehicles.map(v => v._id));
      const cJobs = this.jobs().filter(j => {
        const vid = typeof j.vehicle === 'string' ? j.vehicle : j.vehicle?._id;
        return vid && vehicleIds.has(vid);
      });
      const openJobs = cJobs.filter(j => j.status !== 'completed').length;
      const lifetimeValue = cJobs
        .filter(j => j.status === 'completed')
        .reduce((sum, j) => sum + (j.actualCost ?? j.estimatedCost ?? 0), 0);
      const lastService = cJobs
        .filter(j => j.status === 'completed' && j.updatedAt)
        .map(j => new Date(j.updatedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;
      return {
        customer: c,
        vehicleCount: cVehicles.length,
        openJobs,
        lifetimeValue,
        lastService
      };
    });
  });

  filtered = computed<CustomerRow[]>(() => {
    const q = this.search().toLowerCase().trim();
    const status = this.statusFilter();
    return this.rows().filter(r => {
      if (status !== 'all' && (r.customer.status || 'lead') !== status) return false;
      if (!q) return true;
      return r.customer.name.toLowerCase().includes(q)
        || r.customer.email.toLowerCase().includes(q)
        || r.customer.phone.toLowerCase().includes(q);
    });
  });

  totalRevenue = computed(() => this.rows().reduce((sum, r) => sum + r.lifetimeValue, 0));

  constructor(
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private jobService: JobService,
    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      status: ['lead', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.loadError = null;
    let pending = 3;
    const done = () => { if (--pending === 0) this.loading = false; };
    const fail = (err: any) => {
      console.error(err);
      this.loadError = err?.error?.error || err?.message || 'Could not reach the API';
      this.loading = false;
    };
    this.customerService.getCustomers().subscribe({ next: d => { this.customers.set(d); done(); }, error: fail });
    this.vehicleService.getVehicles().subscribe({ next: d => { this.vehicles.set(d); done(); }, error: fail });
    this.jobService.getJobs().subscribe({ next: d => { this.jobs.set(d); done(); }, error: fail });
  }

  countByStatus(status: CustomerStatus): number {
    return this.rows().filter(r => (r.customer.status || 'lead') === status).length;
  }

  statusTextClass(status?: CustomerStatus): string {
    switch (status) {
      case 'active': return 'text-success';
      case 'lead': return 'text-warning';
      case 'returning': return 'text-primary';
      case 'inactive': return 'text-muted-foreground';
      default: return 'text-warning';
    }
  }

  openCreate() {
    this.editingId = null;
    this.customerForm.reset({ status: 'lead', notes: '' });
    this.isModalOpen = true;
  }

  openEdit(customer: Customer) {
    this.editingId = customer._id!;
    this.customerForm.reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status || 'lead',
      notes: customer.notes || ''
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingId = null;
    this.customerForm.reset({ status: 'lead', notes: '' });
  }

  onSubmit() {
    if (this.customerForm.invalid) return;
    const payload = this.customerForm.value;
    if (this.editingId) {
      this.customerService.updateCustomer(this.editingId, payload).subscribe(updated => {
        this.customers.update(list => list.map(c => c._id === this.editingId ? updated : c));
        this.closeModal();
      });
    } else {
      this.customerService.createCustomer(payload).subscribe(created => {
        this.customers.update(list => [...list, created]);
        this.closeModal();
      });
    }
  }

  onStatusChange(customer: Customer, status: CustomerStatus) {
    this.customerService.updateCustomer(customer._id!, { ...customer, status }).subscribe(updated => {
      this.customers.update(list => list.map(c => c._id === updated._id ? updated : c));
    });
  }

  deleteCustomer(id: string) {
    if (!confirm('Delete this customer?')) return;
    this.customerService.deleteCustomer(id).subscribe(() => {
      this.customers.update(list => list.filter(c => c._id !== id));
    });
  }
}
