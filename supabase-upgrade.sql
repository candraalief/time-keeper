create table if not exists seminar_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text default '',
  duration int not null default 600,
  order_index int not null default 0,
  color text default 'blue',
  notes text default '',
  created_at timestamptz default now()
);

alter table timer_state add column if not exists session_id uuid references seminar_sessions(id);
alter table timer_state add column if not exists session_title text default '';
alter table timer_state add column if not exists session_speaker text default '';
alter table timer_state add column if not exists session_color text default 'blue';
alter table timer_state add column if not exists theme text default 'dark';
alter table timer_state add column if not exists overtime boolean default false;

insert into timer_state (id)
values (1)
on conflict (id) do nothing;

alter table timer_state enable row level security;
alter table seminar_sessions enable row level security;

drop policy if exists "Allow public read timer state" on timer_state;
drop policy if exists "Allow public insert timer state" on timer_state;
drop policy if exists "Allow public update timer state" on timer_state;
drop policy if exists "Allow public read sessions" on seminar_sessions;
drop policy if exists "Allow public insert sessions" on seminar_sessions;
drop policy if exists "Allow public update sessions" on seminar_sessions;
drop policy if exists "Allow public delete sessions" on seminar_sessions;

create policy "Allow public read timer state"
on timer_state for select
using (true);

create policy "Allow public insert timer state"
on timer_state for insert
with check (id = 1);

create policy "Allow public update timer state"
on timer_state for update
using (id = 1)
with check (id = 1);

create policy "Allow public read sessions"
on seminar_sessions for select
using (true);

create policy "Allow public insert sessions"
on seminar_sessions for insert
with check (true);

create policy "Allow public update sessions"
on seminar_sessions for update
using (true)
with check (true);

create policy "Allow public delete sessions"
on seminar_sessions for delete
using (true);
