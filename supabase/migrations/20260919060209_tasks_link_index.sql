-- Cover the composite owner-safe task FK reported by the performance advisor.
create index task_tag_links_task_owner_idx on public.task_tag_links(task_id, user_id);
