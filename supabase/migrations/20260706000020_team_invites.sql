-- Every signup previously created a brand-new organization, so there was no
-- way for an invited teammate to land in an existing org: they'd just get
-- their own separate one. inviteTeamMember() now passes invited_org_id (and
-- invited_role) in the invited user's metadata; this trigger joins that org
-- instead of creating a new one when present.
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
  invited_org_id uuid;
  invited_role user_role;
begin
  invited_org_id := nullif(new.raw_user_meta_data ->> 'invited_org_id', '')::uuid;

  if invited_org_id is not null then
    invited_role := coalesce(
      (nullif(new.raw_user_meta_data ->> 'invited_role', ''))::user_role,
      'member'
    );

    insert into users (id, org_id, full_name, email, role)
    values (
      new.id,
      invited_org_id,
      new.raw_user_meta_data ->> 'full_name',
      new.email,
      invited_role
    );

    return new;
  end if;

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
