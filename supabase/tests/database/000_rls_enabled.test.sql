-- Toda tabela do schema public precisa de RLS ligada, inclusive as que o
-- navegador não acessa: sem política, tudo fica negado (docs/seguranca-rls.md).
begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

select is_empty(
  $$
    select format('%I.%I', n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'toda tabela do schema public tem RLS ligada'
);

select * from finish();

rollback;
