export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive' | 'pending';
  process?: 'prospect' | 'demo' | 'poc' | 'negotiating' | 'lost' | 'won' | 'deployment';
  partnerId?: string;
  productIds?: string[];
  createdAt: Date;
  value: number;
  zone?: 'north' | 'east' | 'west' | 'south';
  assignedUserIds?: string[]; // Changed from single assignedEmployeeId to array
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  company: string;
  specialization: string;
  identity: 'web-app-developer' | 'system-integrator' | 'managed-service-provider' | 'digital-marketer' | 'cyber-security' | 'cloud-hosting' | 'web-hosting' | 'hardware' | 'cloud-service-provider' | 'microsoft-partner' | 'aws-partner' | 'it-consulting' | 'freelance';
  customersCount: number;
  newRevenue: number;
  renewalRevenue: number;
  totalValue: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  agreementSigned: boolean;
  agreementDate?: Date;
  productTypes: string[];
  paymentTerms: 'net-15' | 'net-30' | 'net-45' | 'net-60' | 'net-90' | 'annual-in-advance' | 'monthly' | 'quarterly' | 'half-yearly';
  assignedUserIds?: string[]; // Changed from single assignedEmployeeId to array
  zone?: 'north' | 'east' | 'west' | 'south';
  onboarding?: PartnerOnboardingData;
}

export type OnboardingStage = 'outreach' | 'product-overview' | 'partner-program' | 'kyc' | 'agreement' | 'onboarded';

export interface OnboardingStageData {
  stage: OnboardingStage;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
  notes?: string;
  documents?: string[];
  tasks: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
  completedAt?: Date;
  assignedTo?: string;
}

export interface PartnerOnboardingData {
  currentStage: OnboardingStage;
  overallProgress: number;
  completionPercentage: number;
  startedAt: Date;
  expectedCompletionDate?: Date;
  lastActivity: Date;
  stages: Record<OnboardingStage, OnboardingStageData>;
}

export interface ProductPlan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'yearly' | 'one-time';
  isPopular?: boolean;
}

export interface Product {
  id: string;
  name: string;
  website: string;
  category: string;
  description: string;
  status: 'active' | 'inactive';
  customersCount: number;
  plans: ProductPlan[];
  createdAt: Date;
  lastEdited?: Date;
  // Legacy price field for backward compatibility
  price?: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalPartners: number;
  totalProducts: number;
  totalValue: number;
  activeCustomers: number;
  // Revenue breakdown
  newRevenue: number;
  renewalRevenue: number;
  // Task metrics
  totalTasks: number;
  overdueTasks: number;
  completedTasks: number;
  highPriorityTasks: number;
  // Partner metrics
  activePartnersCount: number;
  partnerOnboardingInProgress: number;
  // Customer process metrics
  customersPipeline: number;
  customersWon: number;
  customersLost: number;
  conversionRate: number;
  // Renewal metrics
  upcomingRenewals: number;
  renewalsAtRisk: number;
  renewalSuccessRate: number;
  // Performance metrics
  averageDealSize: number;
  monthlyGrowthRate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'fsr' | 'team-leader' | 'manager' | 'assistant-manager' | 'bde';
  reportingTo?: string; // ID of the user they report to
  department: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserHierarchy {
  user: User;
  subordinates: UserHierarchy[];
}

export interface Renewal {
  id: string;
  customerId: string;
  partnerId: string;
  productId: string;
  renewalDate: Date;
  contractValue: number;
  status: 'upcoming' | 'due' | 'overdue' | 'renewed' | 'cancelled';
  notificationSent: boolean;
  lastContactDate?: Date;
  notes?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  timeframe: 'monthly' | 'yearly' | 'custom';
  customDateRange?: {
    from: Date;
    to: Date;
  };
  widgets: {
    showStats: boolean;
    showChart: boolean;
    showRenewals: boolean;
    showCustomerTable: boolean;
  };
  filters: {
    customerStatus?: string[];
    partnerIds?: string[];
    productIds?: string[];
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  assignedTo: string; // User ID
  assignedBy?: string; // User ID
  customerId?: string; // Associated customer
  partnerId?: string; // Associated partner
  type: 'customer-outreach' | 'partner-onboarding' | 'renewal-follow-up' | 'training' | 'technical-support' | 'follow-up' | 'meeting' | 'document-review' | 'approval' | 'negotiation' | 'onboarding' | 'support' | 'other';
  notes?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;
  
  // Onboarding-specific fields
  isOnboardingTask?: boolean;
  onboardingStage?: OnboardingStage;
  stageRequirement?: boolean;
  autoGenerated?: boolean;
}

export interface Notification {
  id: string;
  type: 'task' | 'renewal' | 'partner-onboarding' | 'customer-activity' | 'system' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string; // ID of related task, customer, partner, etc.
  relatedType?: 'task' | 'customer' | 'partner' | 'renewal' | 'product';
  actionUrl?: string; // URL to navigate to when clicked
  metadata?: Record<string, any>;
}

export interface PartnerStageChange {
  id: string;
  partnerId: string;
  fromStage: OnboardingStage;
  toStage: OnboardingStage;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  createdAt: Date;
}

export interface PartnerStageReversalRequest {
  id: string;
  partnerId: string;
  fromStage: OnboardingStage;
  toStage: OnboardingStage;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}
