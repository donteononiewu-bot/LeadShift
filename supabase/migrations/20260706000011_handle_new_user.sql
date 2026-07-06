-- On signup, create the user's organization (from metadata passed at
-- signup time) and their user row as 'owner' in one transaction.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
  org_slug text;
begin
  org_name := coalesce(new.raw_user_meta_data ->> 'org_name', split_part(new.email, '@', 1) || '''s Team');
  org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

  insert into organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  insert into users (id, org_id, full_name, email, role)
  values (
    new.id,
    new_org_id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
