import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { VehicleService } from '../../core/services/vehicle.service';
import { Vehicle } from '../../core/interfaces/vehicle.interface';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HlmButton, HlmCardImports],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <a routerLink="/vehicles" class="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          &larr; Back to Vehicles
        </a>
        <button *ngIf="vehicle" hlmBtn variant="destructive" size="sm" (click)="deleteVehicle()">Delete Vehicle</button>
      </div>

      <div *ngIf="loading" class="text-slate-400">Loading details...</div>
      
      <div *ngIf="vehicle && !loading" class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-slate-100">{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}</h1>
          <p class="text-slate-400 mt-1">VIN: <span class="font-mono text-sm text-slate-300">{{ vehicle.vin }}</span></p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div hlmCard class="bg-slate-900/40 border-slate-800/60 backdrop-blur-sm">
            <div hlmCardHeader>
              <h3 hlmCardTitle>Vehicle Details</h3>
            </div>
            <div hlmCardContent class="space-y-3 text-sm">
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Make</span>
                <span class="text-slate-200 font-medium">{{ vehicle.make }}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Model</span>
                <span class="text-slate-200 font-medium">{{ vehicle.model }}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Year</span>
                <span class="text-slate-200 font-medium">{{ vehicle.year }}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Mileage</span>
                <span class="text-slate-200 font-medium">{{ vehicle.mileage | number }}</span>
              </div>
            </div>
          </div>

          <div hlmCard class="bg-slate-900/40 border-slate-800/60 backdrop-blur-sm">
            <div hlmCardHeader>
              <h3 hlmCardTitle>Owner Information</h3>
            </div>
            <div hlmCardContent class="space-y-3 text-sm" *ngIf="ownerData">
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Name</span>
                <span class="text-slate-200 font-medium">{{ ownerData.name }}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Email</span>
                <span class="text-slate-200 font-medium">{{ ownerData.email }}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-2">
                <span class="text-slate-500">Phone</span>
                <span class="text-slate-200 font-medium">{{ ownerData.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VehicleDetail implements OnInit {
  vehicle: Vehicle | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vehicleService.getVehicle(id).subscribe({
        next: (data) => {
          this.vehicle = data;
          this.loading = false;
        },
        error: () => {
          this.router.navigate(['/vehicles']);
        }
      });
    }
  }

  get ownerData(): any {
    return typeof this.vehicle?.customer === 'object' ? this.vehicle.customer : null;
  }

  deleteVehicle() {
    if (this.vehicle && confirm('Are you sure you want to delete this vehicle?')) {
      this.vehicleService.deleteVehicle(this.vehicle._id!).subscribe(() => {
        this.router.navigate(['/vehicles']);
      });
    }
  }
}
