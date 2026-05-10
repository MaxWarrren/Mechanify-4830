import { Vehicle } from './vehicle.interface';

export interface Job {
  _id?: string;
  vehicle: string | Vehicle; // Can be an ID or a populated object
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  estimatedCost: number;
  actualCost?: number;
  createdAt?: string;
  updatedAt?: string;
}
