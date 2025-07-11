import { Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  capacity: number;
  location: string;
  description?: string;
  devices: Array<{
    name: string;
    quantity: number;
    note?: string;
  }>;
  status: 'available' | 'occupied' | 'maintenance';
  features: string[];
  isActive: boolean;
}