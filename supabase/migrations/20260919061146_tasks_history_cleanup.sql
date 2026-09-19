-- Preserve user-deletion cascades while protecting recurrence history.
create or replace function public.task_before_write() returns trigger language plpgsql security invoker set search_path = '' as $$
declare parent public.tasks;
begin
  if TG_OP = 'UPDATE' then
    if new.user_id <> old.user_id or new.parent_task_id is distinct from old.parent_task_id then
      raise exception 'Le propriétaire et les liens historiques ne peuvent pas être modifiés.';
    end if;
    -- Allow the FK to clear a historical reference when its source is deleted
    -- (for example during user-account cleanup), but never allow reassignment.
    if new.generated_from_id is distinct from old.generated_from_id and not (
      new.generated_from_id is null and not exists (
        select 1 from public.tasks where id = old.generated_from_id and user_id = old.user_id
      )
    ) then raise exception 'Le lien historique ne peut pas être modifié.'; end if;
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
