-- Weekly Plan Migration
-- Allows users to customize their default weekly training schedule
-- Used as fallback for periodization when no actual workouts are logged

create table if not exists public.weekly_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6), -- 0=Mon, 6=Sun
  workout_type text not null check (workout_type in ('gym', 'sport', 'cardio', 'rest')),
  workout_name text,
  intensity text check (intensity in ('high', 'moderate', 'recovery')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, day_of_week)
);

-- RLS policies
alter table public.weekly_plan enable row level security;

create policy "Users can view own weekly plan"
  on public.weekly_plan for select
  using (auth.uid() = user_id);

create policy "Users can insert own weekly plan"
  on public.weekly_plan for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weekly plan"
  on public.weekly_plan for update
  using (auth.uid() = user_id);

create policy "Users can delete own weekly plan"
  on public.weekly_plan for delete
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.update_weekly_plan_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_weekly_plan_updated_at_trigger
  before update on public.weekly_plan
  for each row
  execute function public.update_weekly_plan_updated_at();

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.weekly_plan to authenticated;
