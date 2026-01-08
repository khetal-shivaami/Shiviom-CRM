import { DealProduct } from './dealProduct';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  customer_domain: string;
  status: 'active' | 'inactive' | 'pending';
  process: 'prospect' | 'demo' | 'poc' | 'negotiating' | 'lost' | 'won' | 'deployment';
  value: number;
  zone?: string;
  partnerId?: string;
  productIds?: string[];
  assignedUserIds?: string[];
  createdAt: Date;
  lastEdited?: Date;
  deal_products?: DealProduct[];
  [key: string]: any; // For any other properties
}