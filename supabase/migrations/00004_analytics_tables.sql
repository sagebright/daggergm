-- Analytics and performance monitoring tables

-- Analytics events table
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  user_id uuid references auth.users(id),
  session_id uuid,
  properties jsonb default '{}',
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Performance metrics table
create table if not exists public.performance_metrics (
  id uuid default gen_random_uuid() primary key,
  operation text not null,
  duration real not null, -- Duration in seconds
  success boolean not null,
  token_count integer,
  cost real, -- Cost in dollars
  metadata jsonb default '{}',
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.analytics_events enable row level security;
alter table public.performance_metrics enable row level security;

-- Create policies for analytics_events
create policy "Users can insert their own analytics events" on public.analytics_events
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Service role can access all analytics events" on public.analytics_events
  for all using (auth.jwt() ->> 'role' = 'service_role');

-- Create policies for performance_metrics  
create policy "Service role can access all performance metrics" on public.performance_metrics
  for all using (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_timestamp_idx on public.analytics_events(timestamp);

create index if not exists performance_metrics_operation_idx on public.performance_metrics(operation);
create index if not exists performance_metrics_timestamp_idx on public.performance_metrics(timestamp);
create index if not exists performance_metrics_success_idx on public.performance_metrics(success);