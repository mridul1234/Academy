create table if not exists public.crm_students (
  id text primary key,
  lead_id text,
  child_name text not null,
  parent_name text not null,
  email text,
  phone text,
  plan_type text,
  level text,
  enrolled_date date,
  renewal_date date,
  is_active boolean not null default true,
  sessions_total integer not null default 0,
  sessions_done integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_site_metrics (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.crm_students (
  id,
  lead_id,
  child_name,
  parent_name,
  email,
  phone,
  plan_type,
  level,
  enrolled_date,
  renewal_date,
  is_active,
  sessions_total,
  sessions_done,
  notes,
  created_at
)
select
  id::text,
  lead_id::text,
  child_name,
  parent_name,
  email,
  phone,
  plan_type,
  level,
  enrolled_date,
  renewal_date,
  is_active,
  sessions_total,
  sessions_done,
  notes,
  created_at
from public.students
on conflict (id) do nothing;

insert into public.crm_site_metrics (key, value, updated_at)
select key, value, updated_at
from public.site_metrics
where key = 'class_schedule'
on conflict (key) do nothing;
