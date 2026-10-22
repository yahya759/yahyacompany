alter table public.jobs add column if not exists locked_until timestamptz;
update public.settings set value = '{"reddit":true,"google_search":true,"google_maps_reviews":true}', description = 'مصادر رادار المشاكل' where key = 'problem_sources';
delete from public.settings where key in ('llm_model','send_channels');
alter table public.problems add column if not exists market text not null default 'local' check (market in ('gulf','arabic','local'));
