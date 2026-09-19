-- Native, private task workspace. Existing auth and business tables are unchanged.
create table public.task_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  name text not null check (length(trim(name)) between 1 and 80),
  color text not null default '#E8564B' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, user_id), unique (user_id, name)
);
create table public.task_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  name text not null check (length(trim(name)) between 1 and 40),
  color text not null default '#6B7280' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, user_id), unique (user_id, name)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  title text not null check (length(trim(title)) between 1 and 300),
  description text not null default '' check (length(description) <= 20000),
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority smallint not null default 0 check (priority between 0 and 4),
  due_date date,
  due_time time,
  project_id uuid,
  parent_task_id uuid,
  position double precision not null default 0 check (position > '-Infinity'::float8 and position < 'Infinity'::float8),
  someday boolean not null default false,
  is_urgent boolean not null default false,
  is_important boolean not null default false,
  recurrence_frequency text not null default 'none' check (recurrence_frequency in ('none','daily','weekly','monthly')),
  recurrence_interval integer not null default 1 check (recurrence_interval between 1 and 365),
  recurrence_weekdays integer[] not null default '{}',
  recurrence_until date,
  recurrence_month_day integer check (recurrence_month_day between 1 and 31),
  generated_from_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz,
  unique (id, user_id),
  foreign key (project_id, user_id) references public.task_projects(id, user_id) on delete set null (project_id),
  foreign key (parent_task_id, user_id) references public.tasks(id, user_id) on delete cascade,
  foreign key (generated_from_id, user_id) references public.tasks(id, user_id) on delete set null (generated_from_id),
  check (parent_task_id is distinct from id),
  check (due_time is null or due_date is not null),
  check (not someday or due_date is null),
  check (recurrence_frequency = 'none' or (due_date is not null and parent_task_id is null)),
  check (recurrence_until is null or due_date is null or recurrence_until >= due_date),
  check (recurrence_weekdays <@ array[1,2,3,4,5,6,7]),
  check (cardinality(recurrence_weekdays) <= 7)
);
create table public.task_tag_links (
  task_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null default auth.uid() references public.users(id) on delete cascade,
  primary key (task_id, tag_id),
  foreign key (task_id, user_id) references public.tasks(id, user_id) on delete cascade,
  foreign key (tag_id, user_id) references public.task_tags(id, user_id) on delete cascade
);
create index tasks_user_status_idx on public.tasks(user_id, status);
create index tasks_user_due_idx on public.tasks(user_id, due_date) where deleted_at is null;
create index tasks_project_idx on public.tasks(project_id, user_id);
create index tasks_parent_idx on public.tasks(parent_task_id, user_id);
create index tasks_generated_idx on public.tasks(generated_from_id, user_id);
create index task_tag_links_user_idx on public.task_tag_links(user_id);
create index task_tag_links_tag_idx on public.task_tag_links(tag_id, user_id);

alter table public.tasks enable row level security;
alter table public.task_projects enable row level security;
alter table public.task_tags enable row level security;
alter table public.task_tag_links enable row level security;
create policy tasks_owner on public.tasks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy task_projects_owner on public.task_projects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy task_tags_owner on public.task_tags for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy task_tag_links_owner on public.task_tag_links for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.tasks, public.task_projects, public.task_tags, public.task_tag_links to authenticated;
revoke all on public.tasks, public.task_projects, public.task_tags, public.task_tag_links from anon;

-- Pure calendar recurrence: dates do not drift across timezones or short months.
create function public.task_next_date(base_date date, frequency text, step integer, weekdays integer[], month_day integer)
returns date language plpgsql immutable set search_path = '' as $$
declare candidate date; weekday integer; first_day date;
begin
  if frequency = 'daily' then return base_date + step; end if;
  if frequency = 'monthly' then
    first_day := (date_trunc('month', base_date) + make_interval(months => step))::date;
    return first_day + least(coalesce(month_day, extract(day from base_date)::int), extract(day from (first_day + interval '1 month - 1 day'))::int) - 1;
  end if;
  if frequency = 'weekly' then
    if coalesce(cardinality(weekdays),0) = 0 then return base_date + 7 * step; end if;
    for i in 1..(7 * step + 7) loop
      candidate := base_date + i;
      weekday := extract(isodow from candidate)::int;
      if weekday = any(weekdays) and
        ((date_trunc('week', candidate)::date - date_trunc('week', base_date)::date) / 7) % step = 0 then
        return candidate;
      end if;
    end loop;
  end if;
  return null;
end;
$$;

create function public.task_before_write() returns trigger language plpgsql security invoker set search_path = '' as $$
declare parent public.tasks;
begin
  if TG_OP = 'UPDATE' then
    if new.user_id <> old.user_id or new.parent_task_id is distinct from old.parent_task_id or new.generated_from_id is distinct from old.generated_from_id then
      raise exception 'Le propriétaire et les liens historiques ne peuvent pas être modifiés.';
    end if;
    new.created_at := old.created_at;
  end if;
  if new.parent_task_id is not null then
    select * into parent from public.tasks where id = new.parent_task_id and user_id = new.user_id;
    if parent.id is null or parent.parent_task_id is not null then raise exception 'Parent invalide.'; end if;
  end if;
  new.updated_at := clock_timestamp();
  if new.status = 'done' then
    if TG_OP = 'INSERT' then new.completed_at := now();
    elsif old.status <> 'done' then new.completed_at := now();
    else new.completed_at := old.completed_at;
    end if;
  else new.completed_at := null;
  end if;
  if new.recurrence_frequency = 'monthly' and (new.recurrence_month_day is null or (TG_OP = 'UPDATE' and new.due_date is distinct from old.due_date)) then
    new.recurrence_month_day := extract(day from new.due_date)::int;
  end if;
  return new;
end;
$$;
create trigger tasks_before_write before insert or update on public.tasks for each row execute function public.task_before_write();

-- The unique source occurrence makes completion idempotent, including concurrent requests.
create function public.task_generate_occurrence() returns trigger language plpgsql security invoker set search_path = '' as $$
declare next_date date; next_id uuid;
begin
  if new.status <> 'done' or old.status = 'done' or new.recurrence_frequency = 'none' or new.deleted_at is not null then return new; end if;
  next_date := public.task_next_date(new.due_date, new.recurrence_frequency, new.recurrence_interval, new.recurrence_weekdays, new.recurrence_month_day);
  if next_date is null or (new.recurrence_until is not null and next_date > new.recurrence_until) then return new; end if;
  insert into public.tasks (user_id,title,description,priority,due_date,due_time,project_id,position,is_urgent,is_important,recurrence_frequency,recurrence_interval,recurrence_weekdays,recurrence_until,recurrence_month_day,generated_from_id)
  values (new.user_id,new.title,new.description,new.priority,next_date,new.due_time,new.project_id,new.position,new.is_urgent,new.is_important,new.recurrence_frequency,new.recurrence_interval,new.recurrence_weekdays,new.recurrence_until,new.recurrence_month_day,new.id)
  on conflict (generated_from_id) do nothing returning id into next_id;
  if next_id is not null then
    insert into public.task_tag_links(task_id,tag_id,user_id) select next_id,tag_id,user_id from public.task_tag_links where task_id = new.id;
    insert into public.tasks(user_id,title,description,priority,parent_task_id,position)
      select user_id,title,description,priority,next_id,position from public.tasks where parent_task_id = new.id and deleted_at is null;
  end if;
  return new;
end;
$$;
create trigger tasks_generate_occurrence after update on public.tasks for each row execute function public.task_generate_occurrence();

-- One atomic write for the task and tags. Whitelist fields, authenticate and lock first.
create function public.save_task(task_id uuid, patch jsonb, tag_ids uuid[] default null, expected_updated_at timestamptz default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare current_task public.tasks; candidate public.tasks; result_id uuid; owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Non authentifié'; end if;
  if patch - array['title','description','status','priority','due_date','due_time','project_id','parent_task_id','position','someday','is_urgent','is_important','recurrence_frequency','recurrence_interval','recurrence_weekdays','recurrence_until','deleted_at'] <> '{}'::jsonb then raise exception 'Champ invalide'; end if;
  if task_id is null then
    insert into public.tasks(user_id,title,parent_task_id) values(owner_id,patch->>'title',(patch->>'parent_task_id')::uuid) returning * into current_task;
  else
    select * into current_task from public.tasks where id = task_id and user_id = owner_id for update;
    if current_task.id is null then raise exception 'Tâche introuvable'; end if;
    if expected_updated_at is not null and current_task.updated_at <> expected_updated_at then raise exception 'Cette tâche a changé. Actualisez puis réessayez.'; end if;
  end if;
  result_id := current_task.id;
  if tag_ids is not null then
    delete from public.task_tag_links l where l.task_id = result_id;
    insert into public.task_tag_links(task_id,tag_id,user_id) select result_id,t,owner_id from (select distinct unnest(tag_ids) t) x;
  end if;
  candidate := jsonb_populate_record(current_task, patch);
  update public.tasks set title=candidate.title,description=candidate.description,status=candidate.status,priority=candidate.priority,
    due_date=candidate.due_date,due_time=candidate.due_time,project_id=candidate.project_id,position=candidate.position,
    someday=candidate.someday,is_urgent=candidate.is_urgent,is_important=candidate.is_important,
    recurrence_frequency=candidate.recurrence_frequency,recurrence_interval=candidate.recurrence_interval,
    recurrence_weekdays=candidate.recurrence_weekdays,recurrence_until=candidate.recurrence_until,deleted_at=candidate.deleted_at
    where id=result_id;
  return result_id;
end;
$$;
create function public.reorder_tasks(task_ids uuid[]) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or cardinality(task_ids) > 10000 then raise exception 'Ordre invalide'; end if;
  if (select count(*) from public.tasks where id = any(task_ids) and user_id = auth.uid()) <> cardinality(task_ids) then raise exception 'Tâche introuvable'; end if;
  update public.tasks t set position = ordered.n * 1024 from unnest(task_ids) with ordinality ordered(id,n) where t.id = ordered.id and t.user_id = auth.uid();
end;
$$;
revoke all on function public.task_next_date(date,text,integer,integer[],integer), public.task_before_write(), public.task_generate_occurrence(), public.save_task(uuid,jsonb,uuid[],timestamptz), public.reorder_tasks(uuid[]) from public, anon;
grant execute on function public.task_next_date(date,text,integer,integer[],integer), public.save_task(uuid,jsonb,uuid[],timestamptz), public.reorder_tasks(uuid[]) to authenticated;
