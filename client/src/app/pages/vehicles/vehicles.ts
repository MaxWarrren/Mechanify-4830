import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucidePlus, lucideX, lucideSearch, lucideCar, lucideExternalLink } from '@ng-icons/lucide';
import { VehicleService } from '../../core/services/vehicle.service';
import { CustomerService } from '../../core/services/customer.service';
import { JobService } from '../../core/services/job.service';
import { Vehicle } from '../../core/interfaces/vehicle.interface';
import { Customer } from '../../core/interfaces/customer.interface';
import { Job } from '../../core/interfaces/job.interface';

interface VehicleRow {
  vehicle: Vehicle;
  ownerName: string;
  jobCount: number;
  openJobs: number;
  lastService: Date | null;
}

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, HlmButton, HlmInput, HlmLabel, HlmCardImports, HlmIconImports],
  providers: [provideIcons({ lucideTrash2, lucidePlus, lucideX, lucideSearch, lucideCar, lucideExternalLink })],
  template: `
    <div class="space-y-6">

      <div class="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">Vehicles</h1>
          <p class="text-muted-foreground mt-2">Every vehicle the shop services, with active job and service history.</p>
        </div>
        <button hlmBtn (click)="openModal()">
          <ng-icon hlm name="lucidePlus" size="sm" class="mr-2"></ng-icon>
          Add Vehicle
        </button>
      </div>

      <div class="relative max-w-md">
        <ng-icon hlm name="lucideSearch" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"></ng-icon>
        <input
          hlmInput
          type="search"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
          placeholder="Search by make, model, VIN, or owner..."
          class="pl-9 bg-card border-border w-full"
        />
      </div>

      <div class="bg-card/40 border border-border/60 rounded-lg overflow-hidden">

        <div *ngIf="loading" class="text-muted-foreground text-sm p-8 text-center">Loading vehicles...</div>
        <div *ngIf="!loading && loadError" class="text-destructive text-sm p-8 text-center">
          Failed to load vehicles: {{ loadError }}
        </div>
        <div *ngIf="!loading && !loadError && filtered().length === 0" class="text-muted-foreground text-sm p-12 text-center">
          No vehicles found.
        </div>

        <table *ngIf="!loading && !loadError && filtered().length > 0" class="w-full text-sm">
          <thead>
            <tr class="border-b border-border/40 bg-muted/20">
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">VIN</th>
              <th class="h-11 px-4 text-right align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Mileage</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Jobs</th>
              <th class="h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Service</th>
              <th class="h-11 px-3 w-[1%] text-right"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered()" class="border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/30 group">
              <td class="p-4 align-middle">
                <a [routerLink]="['/vehicles', row.vehicle._id]" class="flex items-center gap-3 hover:text-primary transition-colors">
                  <div class="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ng-icon hlm name="lucideCar" size="sm"></ng-icon>
                  </div>
                  <div>
                    <div class="font-medium text-foreground">{{ row.vehicle.year }} {{ row.vehicle.make }} {{ row.vehicle.model }}</div>
                  </div>
                </a>
              </td>
              <td class="p-4 align-middle text-muted-foreground">{{ row.ownerName }}</td>
              <td class="p-4 align-middle font-mono text-xs text-muted-foreground">{{ row.vehicle.vin }}</td>
              <td class="p-4 align-middle text-right text-foreground tabular-nums">{{ row.vehicle.mileage | number }}</td>
              <td class="p-4 align-middle">
                <span *ngIf="row.openJobs > 0" class="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-medium mr-1">
                  {{ row.openJobs }} open
                </span>
                <span class="text-muted-foreground text-xs">{{ row.jobCount }} total</span>
              </td>
              <td class="p-4 align-middle text-muted-foreground">
                {{ row.lastService ? (row.lastService | date:'mediumDate') : '—' }}
              </td>
              <td class="p-3 align-middle text-right">
                <div class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <a [routerLink]="['/vehicles', row.vehicle._id]" class="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60" aria-label="Open">
                    <ng-icon hlm name="lucideExternalLink" size="sm"></ng-icon>
                  </a>
                  <button type="button" class="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted/60"
                          (click)="deleteVehicle(row.vehicle._id!)" aria-label="Delete">
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
        <div hlmCard class="bg-card border-border w-full max-w-lg shadow-xl">
          <div hlmCardHeader class="flex flex-row items-center justify-between">
            <h3 hlmCardTitle>Add New Vehicle</h3>
            <button class="text-muted-foreground hover:text-foreground" (click)="closeModal()">
              <ng-icon hlm name="lucideX" size="sm"></ng-icon>
            </button>
          </div>
          <div hlmCardContent>
            <form [formGroup]="vehicleForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="space-y-1.5">
                <label hlmLabel for="customer">Owner</label>
                <select id="customer" formControlName="customer"
                        class="w-full bg-background border border-border text-foreground rounded-md py-2 px-3 text-sm">
                  <option value="" disabled>Select a customer</option>
                  <option *ngFor="let c of customers()" [value]="c._id">{{ c.name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label hlmLabel for="make">Make</label>
                  <input hlmInput id="make" formControlName="make" placeholder="Honda" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label hlmLabel for="model">Model</label>
                  <input hlmInput id="model" formControlName="model" placeholder="Civic" class="w-full" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label hlmLabel for="year">Year</label>
                  <input hlmInput id="year" type="number" formControlName="year" placeholder="2020" class="w-full" />
                </div>
                <div class="space-y-1.5">
                  <label hlmLabel for="mileage">Mileage</label>
                  <input hlmInput id="mileage" type="number" formControlName="mileage" placeholder="45000" class="w-full" />
                </div>
              </div>
              <div class="space-y-1.5">
                <label hlmLabel for="vin">VIN</label>
                <input hlmInput id="vin" formControlName="vin" placeholder="1HGCM826..." class="w-full font-mono text-sm" />
              </div>
              <div class="flex justify-end gap-3 mt-6">
                <button hlmBtn variant="outline" type="button" (click)="closeModal()">Cancel</button>
                <button hlmBtn type="submit" [disabled]="vehicleForm.invalid">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  `
})
export class Vehicles implements OnInit {
  loading = true;
  loadError: string | null = null;
  isModalOpen = false;
  vehicleForm: FormGroup;

  vehicles = signal<Vehicle[]>([]);
  customers = signal<Customer[]>([]);
  jobs = signal<Job[]>([]);
  search = signal('');

  rows = computed<VehicleRow[]>(() => {
    return this.vehicles().map(v => {
      const ownerName = this.ownerName(v);
      const vid = v._id;
      const cJobs = this.jobs().filter(j => {
        const jvid = typeof j.vehicle === 'string' ? j.vehicle : j.vehicle?._id;
        return jvid === vid;
      });
      const openJobs = cJobs.filter(j => j.status !== 'completed').length;
      const lastService = cJobs
        .filter(j => j.status === 'completed' && j.updatedAt)
        .map(j => new Date(j.updatedAt!))
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;
      return { vehicle: v, ownerName, jobCount: cJobs.length, openJobs, lastService };
    });
  });

  filtered = computed<VehicleRow[]>(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.rows();
    return this.rows().filter(r =>
      r.vehicle.make.toLowerCase().includes(q)
      || r.vehicle.model.toLowerCase().includes(q)
      || r.vehicle.vin.toLowerCase().includes(q)
      || r.ownerName.toLowerCase().includes(q)
    );
  });

  constructor(
    private vehicleService: VehicleService,
    private customerService: CustomerService,
    private jobService: JobService,
    private fb: FormBuilder
  ) {
    this.vehicleForm = this.fb.group({
      customer: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]],
      vin: ['', Validators.required],
      mileage: ['', [Validators.required, Validators.min(0)]]
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

  ownerName(v: Vehicle): string {
    if (typeof v.customer === 'string') {
      return this.customers().find(c => c._id === v.customer)?.name || 'Unknown';
    }
    return (v.customer as Customer)?.name || 'Unknown';
  }

  openModal() {
    this.vehicleForm.reset();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.vehicleForm.reset();
  }

  onSubmit() {
    if (this.vehicleForm.invalid) return;
    this.vehicleService.createVehicle(this.vehicleForm.value).subscribe(created => {
      this.vehicles.update(list => [...list, created]);
      this.closeModal();
    });
  }

  deleteVehicle(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    this.vehicleService.deleteVehicle(id).subscribe(() => {
      this.vehicles.update(list => list.filter(v => v._id !== id));
    });
  }
}
