export type CrmRole = 'coach' | 'student';

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

export type CoachProfile = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  active_students: number;
};

export type SiteMetric = {
  key: string;
  value: string | null;
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

export type CrmSessionStatus = 'upcoming' | 'completed';

export type ClassSession = {
  id: string;
  student_id: string;
  coach_id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
  status: CrmSessionStatus;
  meeting_link?: string | null;
  notes?: string | null;
  remaining_sessions?: number;
  session_number?: number;
  total_sessions?: number;
};

export type CrmSession = {
  role: CrmRole;
  email: string;
  name: string;
  subjectId: string;
};

export type CrmData = {
  session: CrmSession;
  coach: CoachProfile;
  students: Student[];
  classSessions: ClassSession[];
};
