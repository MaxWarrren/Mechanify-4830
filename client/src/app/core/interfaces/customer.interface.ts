export type CustomerStatus = 'lead' | 'active' | 'returning' | 'inactive';

export interface Customer {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  status?: CustomerStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
