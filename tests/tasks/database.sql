-- Run against the migrated project. Everything, including fixtures, is rolled back.
begin;
insert into public.users(id,email,role) values
 ('10000000-0000-4000-8000-000000000001','tasks-test-a@example.invalid','setter'),
 ('10000000-0000-4000-8000-000000000002','tasks-test-b@example.invalid','setter');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
#variable_conflict use_variable
declare task_id uuid; child_id uuid; next_id uuid; project_id uuid; tag_id uuid; v timestamptz;
begin
  if public.task_next_date('2026-01-31','monthly',1,'{}',31) <> '2026-02-28' then raise exception 'Month clamp failed'; end if;
  if public.task_next_date('2026-02-28','monthly',1,'{}',31) <> '2026-03-31' then raise exception 'Month anchor failed'; end if;
  if public.task_next_date('2028-01-31','monthly',1,'{}',31) <> '2028-02-29' then raise exception 'Leap year failed'; end if;
  if public.task_next_date('2026-09-18','weekly',2,'{1,3,5}',null) <> '2026-09-28' then raise exception 'Week interval failed'; end if;
  if public.task_next_date('2026-09-14','weekly',2,'{1,3,5}',null) <> '2026-09-16' then raise exception 'Multiple weekdays failed'; end if;
  if public.task_next_date('2026-09-19','daily',2,'{}',null) <> '2026-09-21' then raise exception 'Daily interval failed'; end if;
  insert into public.task_projects(name) values('Test project') returning id into project_id;
  insert into public.task_tags(name) values('Test tag') returning id into tag_id;
  task_id := public.save_task(null,jsonb_build_object('title','Recurring test','due_date','2026-01-31','recurrence_frequency','monthly','project_id',project_id),array[tag_id]);
  child_id := public.save_task(null,jsonb_build_object('title','Child','parent_task_id',task_id));
  perform public.save_task(child_id,'{"status":"done"}');
  perform public.save_task(task_id,'{"status":"done"}');
  select id into next_id from public.tasks where generated_from_id=task_id;
  if next_id is null then raise exception 'Missing occurrence'; end if;
  if (select due_date from public.tasks where id=next_id) <> '2026-02-28' then raise exception 'Wrong next date'; end if;
  if (select count(*) from public.tasks where parent_task_id=next_id and status='todo') <> 1 then raise exception 'Subtask cloning failed'; end if;
  if (select count(*) from public.task_tag_links links where links.task_id=next_id) <> 1 then raise exception 'Tag cloning failed'; end if;
  if (select completed_at from public.tasks where id=task_id) is null then raise exception 'Missing completion timestamp'; end if;
  perform public.save_task(task_id,'{"status":"todo"}');
  perform public.save_task(task_id,'{"status":"done"}');
  if (select count(*) from public.tasks where generated_from_id=task_id) <> 1 then raise exception 'Duplicate occurrence'; end if;
  perform public.save_task(next_id,'{"status":"done"}');
  if (select due_date from public.tasks where generated_from_id=next_id) <> '2026-03-31' then raise exception 'Lost monthly anchor'; end if;
  delete from public.tasks where id=task_id;
  if (select generated_from_id from public.tasks where id=next_id) is not null then raise exception 'History FK cleanup failed'; end if;
  task_id := public.save_task(null,'{"title":"Last occurrence","due_date":"2026-09-19","recurrence_frequency":"daily","recurrence_until":"2026-09-19"}');
  perform public.save_task(task_id,'{"status":"done"}');
  if exists(select 1 from public.tasks where generated_from_id=task_id) then raise exception 'End date ignored'; end if;
  select updated_at into v from public.tasks where id=task_id;
  perform public.save_task(task_id,'{"title":"New version"}');
  begin
    perform public.save_task(task_id,'{"title":"Stale overwrite"}',null,v);
    raise exception 'Stale write allowed';
  exception when raise_exception then if sqlerrm not like '%changé%' then raise; end if; end;
  perform public.save_task(task_id,jsonb_build_object('deleted_at',now()));
  perform public.save_task(task_id,'{"deleted_at":null}');
  if (select deleted_at from public.tasks where id=task_id) is not null then raise exception 'Restore failed'; end if;
  delete from public.task_projects where id=project_id;
  if exists(select 1 from public.tasks t where t.project_id is not null) then raise exception 'Project unlink failed'; end if;
  insert into public.task_projects(name) values('Private project');
end $$;
-- Preserve references in session settings, then switch actor.
select set_config('test.other_task',(select id::text from public.tasks limit 1),true);
select set_config('test.other_project',(select id::text from public.task_projects limit 1),true);
select set_config('test.other_tag',(select id::text from public.task_tags limit 1),true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
do $$
declare own_id uuid; affected integer;
begin
  if exists(select 1 from public.tasks) or exists(select 1 from public.task_projects) or exists(select 1 from public.task_tags) or exists(select 1 from public.task_tag_links) then raise exception 'RLS read leak'; end if;
  update public.tasks set title='Intrusion' where id=current_setting('test.other_task')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'RLS update leak'; end if;
  delete from public.tasks where id=current_setting('test.other_task')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'RLS delete leak'; end if;
  begin
    insert into public.tasks(title,user_id) values('Spoof','10000000-0000-4000-8000-000000000001');
    raise exception 'Owner spoof accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_task(null,jsonb_build_object('title','Foreign parent','parent_task_id',current_setting('test.other_task')));
    raise exception 'Foreign parent accepted';
  exception when raise_exception then if sqlerrm <> 'Parent invalide.' then raise; end if; end;
  begin
    perform public.save_task(null,jsonb_build_object('title','Foreign project','project_id',current_setting('test.other_project')));
    raise exception 'Foreign project accepted';
  exception when foreign_key_violation then null; end;
  own_id := public.save_task(null,'{"title":"My own task"}');
  begin
    perform public.save_task(own_id,'{"title":"Should roll back"}',array[current_setting('test.other_tag')::uuid]);
    raise exception 'Foreign tag accepted';
  exception when foreign_key_violation then null; end;
  if (select title from public.tasks where id=own_id) <> 'My own task' then raise exception 'Atomicity failed'; end if;
  begin
    perform public.save_task(current_setting('test.other_task')::uuid,'{"title":"Intrusion"}');
    raise exception 'RPC access leak';
  exception when raise_exception then if sqlerrm <> 'Tâche introuvable' then raise; end if; end;
  begin
    perform public.reorder_tasks(array[own_id,current_setting('test.other_task')::uuid]);
    raise exception 'Reorder access leak';
  exception when raise_exception then if sqlerrm <> 'Tâche introuvable' then raise; end if; end;
end $$;
set local role anon;
do $$ begin
  begin perform count(*) from public.tasks; raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.save_task(null,'{"title":"Anonymous"}'); raise exception 'Anonymous RPC allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- Real account deletion must be able to cascade across recurrence chains.
delete from public.users where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
select 'PASS: recurrence, history, subtasks, tags, optimistic locking, restore, project deletion, RLS and RPC isolation' as result;
rollback;
