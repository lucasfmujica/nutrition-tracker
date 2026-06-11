-- Friend challenges (additive migration, follows social tables RLS pattern)
-- Applied via Supabase MCP as migration: create_challenges

create table if not exists public.challenges (
    id uuid primary key default gen_random_uuid(),
    creator_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    metric text not null check (metric in ('steps','protein','workouts','water','logging_streak')),
    goal_value numeric,
    start_date date not null,
    end_date date not null,
    status text not null default 'active' check (status in ('active','finished','cancelled')),
    created_at timestamptz not null default now(),
    constraint challenges_date_range check (end_date >= start_date)
);

create table if not exists public.challenge_participants (
    id uuid primary key default gen_random_uuid(),
    challenge_id uuid not null references public.challenges(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'invited' check (status in ('invited','accepted','declined')),
    progress numeric not null default 0,
    joined_at timestamptz,
    created_at timestamptz not null default now(),
    unique (challenge_id, user_id)
);

create index if not exists idx_challenge_participants_user on public.challenge_participants(user_id);
create index if not exists idx_challenge_participants_challenge on public.challenge_participants(challenge_id);
create index if not exists idx_challenges_creator on public.challenges(creator_id);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- SECURITY DEFINER helper to avoid recursive RLS between challenges <-> participants
create or replace function public.is_challenge_member(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.challenge_participants cp
        where cp.challenge_id = cid and cp.user_id = auth.uid()
    );
$$;

-- challenges: creator and participants/invitees can view
create policy "Users can view their challenges"
    on public.challenges for select
    using (auth.uid() = creator_id or public.is_challenge_member(id));

-- challenges: creator creates
create policy "Users can create challenges"
    on public.challenges for insert
    with check (auth.uid() = creator_id);

-- challenges: creator can update (finish/cancel)
create policy "Creators can update their challenges"
    on public.challenges for update
    using (auth.uid() = creator_id)
    with check (auth.uid() = creator_id);

-- challenges: creator can delete
create policy "Creators can delete their challenges"
    on public.challenges for delete
    using (auth.uid() = creator_id);

-- participants: members and creator can view all rows of their challenges
create policy "Members can view challenge participants"
    on public.challenge_participants for select
    using (
        user_id = auth.uid()
        or public.is_challenge_member(challenge_id)
        or exists (
            select 1 from public.challenges c
            where c.id = challenge_id and c.creator_id = auth.uid()
        )
    );

-- participants: creator invites (and adds himself)
create policy "Creators can add participants"
    on public.challenge_participants for insert
    with check (
        exists (
            select 1 from public.challenges c
            where c.id = challenge_id and c.creator_id = auth.uid()
        )
    );

-- participants: each user updates their own participation (accept/decline/progress)
create policy "Users can update own participation"
    on public.challenge_participants for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- participants: user can leave, creator can remove
create policy "Users can delete own participation"
    on public.challenge_participants for delete
    using (
        user_id = auth.uid()
        or exists (
            select 1 from public.challenges c
            where c.id = challenge_id and c.creator_id = auth.uid()
        )
    );
