export type LeadStatus = 'new' | 'contacted' | 'demo_scheduled' | 'demo_done' | 'enrolled' | 'lost';
export type LeadSource = 'unknown' | 'facebook' | 'instagram' | 'google' | 'word_of_mouth' | 'website' | 'other';
export type StudentStatus = 'active' | 'paused' | 'churned';

export type Lead = {
  id: string;
  created_at: string;
  parent_name: string;
  child_name: string;
  email?: string | null;
  phone: string;
  child_age?: number | null;
  source: LeadSource;
  message?: string | null;
  interested_plan?: string | null;
  status: LeadStatus;
  is_paid: boolean;
  payment_amount?: number | null;
  payment_date?: string | null;
  enrolled_at?: string | null;
  lost_reason?: string | null;
  last_contacted_at?: string | null;
  archived: boolean;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
};

export type RevenueEntry = {
  id: string;
  created_at: string;
  transaction_date: string;
  amount: number;
  student_name?: string | null;
  plan_type?: string | null;
  payment_method: 'razorpay' | 'upi' | 'cash' | 'bank_transfer' | 'manual';
  razorpay_payment_id?: string | null;
  description?: string | null;
  lead_id?: string | null;
};

export type Student = {
  id: string;
  lead_id?: string | null;
  child_name: string;
  parent_name: string;
  email?: string | null;
  phone?: string | null;
  plan_type?: string | null;
  level?: string | null;
  enrolled_date?: string | null;
  renewal_date?: string | null;
  is_active: boolean;
  sessions_total: number;
  sessions_done: number;
  notes?: string | null;
  created_at: string;
};

export type SiteMetric = {
  key: string;
  value: string;
  updated_at: string;
};

export type ScheduleEntry = {
  id: string;
  student_id: string;
  day: number;
  start_hour: number;
  duration_hours: number;
  title?: string;
  note?: string;
};

export type DashboardData = {
  leads: Lead[];
  lead_notes: LeadNote[];
  revenue_entries: RevenueEntry[];
  students: Student[];
  site_metrics: SiteMetric[];
};
