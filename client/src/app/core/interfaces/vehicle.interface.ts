import { Customer } from './customer.interface';

export interface Vehicle {
  _id?: string;
  customer: string | Customer; // Can be an ID or a populated object
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  createdAt?: string;
  updatedAt?: string;
}
