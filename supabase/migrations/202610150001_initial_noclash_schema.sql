-- =========================================================
-- NOCLASH
-- INITIAL DATABASE SCHEMA
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  display_name text,

  timezone text,

  created_at timestamptz
    not null
    default now()
);

alter table public.profiles
enable row level security;


-- =========================================================
-- PROFILE CREATION TRIGGER
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  insert into public.profiles (
    id
  )
  values (
    new.id
  )
  on conflict (id)
  do nothing;

  return new;

end;
$$;


drop trigger if exists
  on_auth_user_created
on auth.users;


create trigger
  on_auth_user_created
after insert
on auth.users
for each row
execute procedure
  public.handle_new_user();


-- =========================================================
-- GROUPS
-- =========================================================

create table if not exists public.groups (
  id uuid primary key
    default gen_random_uuid(),

  name text
    not null
    check (
      char_length(name)
      between 1 and 80
    ),

  created_by uuid
    not null
    references public.profiles(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now()
);

alter table public.groups
enable row level security;


-- =========================================================
-- GROUP MEMBERS
-- =========================================================

create table if not exists public.group_members (
  group_id uuid
    not null
    references public.groups(id)
    on delete cascade,

  user_id uuid
    not null
    references public.profiles(id)
    on delete cascade,

  role text
    not null
    default 'member'
    check (
      role in (
        'owner',
        'member'
      )
    ),

  joined_at timestamptz
    not null
    default now(),

  primary key (
    group_id,
    user_id
  )
);

alter table public.group_members
enable row level security;


-- =========================================================
-- HELPER: IS GROUP MEMBER
-- =========================================================

create or replace function public.is_group_member(
  target_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where
      gm.group_id =
        target_group_id
      and gm.user_id =
        (select auth.uid())
  );
$$;


-- =========================================================
-- HELPER: SHARES GROUP WITH USER
-- =========================================================

create or replace function public.shares_group_with(
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members mine

    join public.group_members theirs
      on theirs.group_id =
         mine.group_id

    where
      mine.user_id =
        (select auth.uid())

      and theirs.user_id =
        target_user_id
  );
$$;


-- =========================================================
-- AUTOMATICALLY ADD GROUP OWNER
-- =========================================================

create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  insert into public.group_members (
    group_id,
    user_id,
    role
  )
  values (
    new.id,
    new.created_by,
    'owner'
  );

  return new;

end;
$$;


drop trigger if exists
  on_group_created
on public.groups;


create trigger
  on_group_created
after insert
on public.groups
for each row
execute procedure
  public.handle_new_group();


-- =========================================================
-- GROUP INVITES
-- =========================================================

create table if not exists public.group_invites (
  id uuid primary key
    default gen_random_uuid(),

  group_id uuid
    not null
    references public.groups(id)
    on delete cascade,

  token uuid
    not null
    unique
    default gen_random_uuid(),

  created_by uuid
    not null
    references public.profiles(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now(),

  expires_at timestamptz
    not null
    default (
      now() +
      interval '7 days'
    ),

  accepted_by uuid
    references public.profiles(id)
    on delete set null,

  accepted_at timestamptz
);

alter table public.group_invites
enable row level security;


-- =========================================================
-- BUSY BLOCKS
-- =========================================================

create table if not exists public.busy_blocks (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid
    not null
    references public.profiles(id)
    on delete cascade,

  starts_at timestamptz
    not null,

  ends_at timestamptz
    not null,

  created_at timestamptz
    not null
    default now(),

  check (
    ends_at >
    starts_at
  )
);

alter table public.busy_blocks
enable row level security;


-- =========================================================
-- EVENTS
-- =========================================================

create table if not exists public.events (
  id uuid primary key
    default gen_random_uuid(),

  group_id uuid
    not null
    references public.groups(id)
    on delete cascade,

  created_by uuid
    not null
    references public.profiles(id)
    on delete cascade,

  title text
    not null
    check (
      char_length(title)
      between 1 and 100
    ),

  starts_at timestamptz
    not null,

  ends_at timestamptz
    not null,

  created_at timestamptz
    not null
    default now(),

  check (
    ends_at >
    starts_at
  )
);

alter table public.events
enable row level security;


-- =========================================================
-- PROFILE RLS
-- =========================================================

drop policy if exists
  "Users can view own profile"
on public.profiles;

create policy
  "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  id =
  (select auth.uid())
);


drop policy if exists
  "Users can update own profile"
on public.profiles;

create policy
  "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  id =
  (select auth.uid())
)
with check (
  id =
  (select auth.uid())
);


drop policy if exists
  "Group members can view each other's profiles"
on public.profiles;

create policy
  "Group members can view each other's profiles"
on public.profiles
for select
to authenticated
using (
  public.shares_group_with(id)
);


-- =========================================================
-- GROUP RLS
-- =========================================================

drop policy if exists
  "Authenticated users can create groups"
on public.groups;

create policy
  "Authenticated users can create groups"
on public.groups
for insert
to authenticated
with check (
  created_by =
  (select auth.uid())
);


drop policy if exists
  "Members can view groups"
on public.groups;

create policy
  "Members can view groups"
on public.groups
for select
to authenticated
using (
  public.is_group_member(id)
);


drop policy if exists
  "Owners can update groups"
on public.groups;

create policy
  "Owners can update groups"
on public.groups
for update
to authenticated
using (
  created_by =
  (select auth.uid())
)
with check (
  created_by =
  (select auth.uid())
);


drop policy if exists
  "Owners can delete groups"
on public.groups;

create policy
  "Owners can delete groups"
on public.groups
for delete
to authenticated
using (
  created_by =
  (select auth.uid())
);


-- =========================================================
-- GROUP MEMBER RLS
-- =========================================================

drop policy if exists
  "Members can view memberships"
on public.group_members;

create policy
  "Members can view memberships"
on public.group_members
for select
to authenticated
using (
  public.is_group_member(
    group_id
  )
);


-- =========================================================
-- BUSY BLOCK RLS
-- =========================================================

drop policy if exists
  "Users can create own busy blocks"
on public.busy_blocks;

create policy
  "Users can create own busy blocks"
on public.busy_blocks
for insert
to authenticated
with check (
  user_id =
  (select auth.uid())
);


drop policy if exists
  "Users can update own busy blocks"
on public.busy_blocks;

create policy
  "Users can update own busy blocks"
on public.busy_blocks
for update
to authenticated
using (
  user_id =
  (select auth.uid())
)
with check (
  user_id =
  (select auth.uid())
);


drop policy if exists
  "Users can delete own busy blocks"
on public.busy_blocks;

create policy
  "Users can delete own busy blocks"
on public.busy_blocks
for delete
to authenticated
using (
  user_id =
  (select auth.uid())
);


drop policy if exists
  "Users can view shared-group busy blocks"
on public.busy_blocks;

create policy
  "Users can view shared-group busy blocks"
on public.busy_blocks
for select
to authenticated
using (
  user_id =
    (select auth.uid())
  or
  public.shares_group_with(
    user_id
  )
);


-- =========================================================
-- EVENT RLS
-- =========================================================

drop policy if exists
  "Members can view group events"
on public.events;

create policy
  "Members can view group events"
on public.events
for select
to authenticated
using (
  public.is_group_member(
    group_id
  )
);


-- =========================================================
-- CREATE INVITE
-- =========================================================

create or replace function public.create_group_invite(
  target_group_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_token uuid;
begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  if not exists (
    select 1
    from public.groups g
    where
      g.id =
        target_group_id
      and g.created_by =
        (select auth.uid())
  ) then
    raise exception
      'Only the group owner can create invitations.';
  end if;

  insert into public.group_invites (
    group_id,
    created_by
  )
  values (
    target_group_id,
    (select auth.uid())
  )
  returning token
  into invite_token;

  return invite_token;

end;
$$;


-- =========================================================
-- INVITE INFORMATION
-- =========================================================

create or replace function public.get_group_invite_info(
  invite_token uuid
)
returns table (
  group_id uuid,
  group_name text,
  expires_at timestamptz,
  is_valid boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    gi.group_id,
    g.name,
    gi.expires_at,
    (
      gi.accepted_at is null
      and gi.expires_at > now()
    ) as is_valid

  from public.group_invites gi

  join public.groups g
    on g.id =
       gi.group_id

  where
    gi.token =
      invite_token;
$$;


-- =========================================================
-- ACCEPT INVITE
-- =========================================================

create or replace function public.accept_group_invite(
  invite_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row
    public.group_invites%rowtype;

begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  select *
  into invite_row
  from public.group_invites
  where
    token =
      invite_token
  for update;

  if not found then
    raise exception
      'Invitation not found.';
  end if;

  if
    invite_row.accepted_at
      is not null
  then
    raise exception
      'This invitation has already been used.';
  end if;

  if
    invite_row.expires_at <=
      now()
  then
    raise exception
      'This invitation has expired.';
  end if;

  if exists (
    select 1
    from public.group_members gm
    where
      gm.group_id =
        invite_row.group_id
      and gm.user_id =
        (select auth.uid())
  ) then
    raise exception
      'You are already a member of this group.';
  end if;

  insert into public.group_members (
    group_id,
    user_id,
    role
  )
  values (
    invite_row.group_id,
    (select auth.uid()),
    'member'
  );

  update public.group_invites
  set
    accepted_by =
      (select auth.uid()),
    accepted_at =
      now()
  where
    id =
      invite_row.id;

  return
    invite_row.group_id;

end;
$$;


-- =========================================================
-- CREATE EVENT
-- =========================================================

create or replace function public.create_group_event(
  target_group_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_ends_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_event_id uuid;
begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  if not public.is_group_member(
    target_group_id
  ) then
    raise exception
      'You are not a member of this group.';
  end if;

  if
    char_length(
      trim(event_title)
    ) < 1
    or
    char_length(
      trim(event_title)
    ) > 100
  then
    raise exception
      'Event title must be between 1 and 100 characters.';
  end if;

  if
    event_ends_at <=
    event_starts_at
  then
    raise exception
      'Event end time must be after start time.';
  end if;

  if exists (
    select 1

    from public.busy_blocks b

    join public.group_members gm
      on gm.user_id =
         b.user_id

    where
      gm.group_id =
        target_group_id

      and b.starts_at <
        event_ends_at

      and b.ends_at >
        event_starts_at
  ) then
    raise exception
      'This event conflicts with a group member''s busy time.';
  end if;

  if exists (
    select 1
    from public.events e
    where
      e.group_id =
        target_group_id

      and e.starts_at <
        event_ends_at

      and e.ends_at >
        event_starts_at
  ) then
    raise exception
      'This event conflicts with another group event.';
  end if;

  insert into public.events (
    group_id,
    created_by,
    title,
    starts_at,
    ends_at
  )
  values (
    target_group_id,
    (select auth.uid()),
    trim(event_title),
    event_starts_at,
    event_ends_at
  )
  returning id
  into new_event_id;

  return new_event_id;

end;
$$;


-- =========================================================
-- UPDATE EVENT
-- =========================================================

create or replace function public.update_group_event(
  target_event_id uuid,
  event_title text,
  event_starts_at timestamptz,
  event_ends_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_event
    public.events%rowtype;

  owner_id uuid;

begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  select *
  into existing_event
  from public.events
  where
    id =
      target_event_id
  for update;

  if not found then
    raise exception
      'Event not found.';
  end if;

  select created_by
  into owner_id
  from public.groups
  where
    id =
      existing_event.group_id;

  if
    existing_event.created_by <>
      (select auth.uid())
    and
    owner_id <>
      (select auth.uid())
  then
    raise exception
      'You do not have permission to edit this event.';
  end if;

  if
    char_length(
      trim(event_title)
    ) < 1
    or
    char_length(
      trim(event_title)
    ) > 100
  then
    raise exception
      'Event title must be between 1 and 100 characters.';
  end if;

  if
    event_ends_at <=
    event_starts_at
  then
    raise exception
      'Event end time must be after start time.';
  end if;

  if exists (
    select 1

    from public.busy_blocks b

    join public.group_members gm
      on gm.user_id =
         b.user_id

    where
      gm.group_id =
        existing_event.group_id

      and b.starts_at <
        event_ends_at

      and b.ends_at >
        event_starts_at
  ) then
    raise exception
      'This event conflicts with a group member''s busy time.';
  end if;

  if exists (
    select 1
    from public.events e

    where
      e.group_id =
        existing_event.group_id

      and e.id <>
        target_event_id

      and e.starts_at <
        event_ends_at

      and e.ends_at >
        event_starts_at
  ) then
    raise exception
      'This event conflicts with another group event.';
  end if;

  update public.events
  set
    title =
      trim(event_title),
    starts_at =
      event_starts_at,
    ends_at =
      event_ends_at

  where
    id =
      target_event_id;

  return target_event_id;

end;
$$;


-- =========================================================
-- DELETE EVENT
-- =========================================================

create or replace function public.delete_group_event(
  target_event_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_event
    public.events%rowtype;

  owner_id uuid;

  event_group_id uuid;

begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  select *
  into existing_event
  from public.events
  where
    id =
      target_event_id
  for update;

  if not found then
    raise exception
      'Event not found.';
  end if;

  event_group_id =
    existing_event.group_id;

  select created_by
  into owner_id
  from public.groups
  where
    id =
      existing_event.group_id;

  if
    existing_event.created_by <>
      (select auth.uid())
    and
    owner_id <>
      (select auth.uid())
  then
    raise exception
      'You do not have permission to delete this event.';
  end if;

  delete from public.events
  where
    id =
      target_event_id;

  return event_group_id;

end;
$$;


-- =========================================================
-- RENAME GROUP
-- =========================================================

create or replace function public.rename_group(
  target_group_id uuid,
  new_group_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  if not exists (
    select 1
    from public.groups g
    where
      g.id =
        target_group_id
  ) then
    raise exception
      'Group not found.';
  end if;

  if not exists (
    select 1
    from public.groups g
    where
      g.id =
        target_group_id
      and g.created_by =
        (select auth.uid())
  ) then
    raise exception
      'Only the group owner can rename this group.';
  end if;

  if
    char_length(
      trim(new_group_name)
    ) < 1
    or
    char_length(
      trim(new_group_name)
    ) > 80
  then
    raise exception
      'Group name must be between 1 and 80 characters.';
  end if;

  update public.groups
  set
    name =
      trim(new_group_name)
  where
    id =
      target_group_id;

  return target_group_id;

end;
$$;


-- =========================================================
-- REMOVE MEMBER
-- =========================================================

create or replace function public.remove_group_member(
  target_group_id uuid,
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  select g.created_by
  into owner_id
  from public.groups g
  where
    g.id =
      target_group_id;

  if owner_id is null then
    raise exception
      'Group not found.';
  end if;

  if
    owner_id <>
      (select auth.uid())
  then
    raise exception
      'Only the group owner can remove members.';
  end if;

  if
    target_user_id =
      owner_id
  then
    raise exception
      'The group owner cannot be removed.';
  end if;

  if not exists (
    select 1
    from public.group_members gm
    where
      gm.group_id =
        target_group_id
      and gm.user_id =
        target_user_id
  ) then
    raise exception
      'This user is not a member of the group.';
  end if;

  delete from public.group_members
  where
    group_id =
      target_group_id
    and user_id =
      target_user_id;

  return target_user_id;

end;
$$;


-- =========================================================
-- LEAVE GROUP
-- =========================================================

create or replace function public.leave_group(
  target_group_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  select g.created_by
  into owner_id
  from public.groups g
  where
    g.id =
      target_group_id;

  if owner_id is null then
    raise exception
      'Group not found.';
  end if;

  if
    owner_id =
      (select auth.uid())
  then
    raise exception
      'The group owner cannot leave. Delete the group instead.';
  end if;

  if not exists (
    select 1
    from public.group_members gm
    where
      gm.group_id =
        target_group_id
      and gm.user_id =
        (select auth.uid())
  ) then
    raise exception
      'You are not a member of this group.';
  end if;

  delete from public.group_members
  where
    group_id =
      target_group_id
    and user_id =
      (select auth.uid());

  return target_group_id;

end;
$$;


-- =========================================================
-- DELETE GROUP
-- =========================================================

create or replace function public.delete_group(
  target_group_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin

  if (
    select auth.uid()
  ) is null then
    raise exception
      'You must be logged in.';
  end if;

  if not exists (
    select 1
    from public.groups g
    where
      g.id =
        target_group_id
  ) then
    raise exception
      'Group not found.';
  end if;

  if not exists (
    select 1
    from public.groups g
    where
      g.id =
        target_group_id
      and g.created_by =
        (select auth.uid())
  ) then
    raise exception
      'Only the group owner can delete this group.';
  end if;

  delete from public.groups
  where
    id =
      target_group_id;

  return target_group_id;

end;
$$;


-- =========================================================
-- TABLE PERMISSIONS
-- =========================================================

-- Profiles are created by the auth trigger.
-- Authenticated users only need to read/update profiles.
grant select, update
on public.profiles
to authenticated;


grant select, insert, update, delete
on public.groups
to authenticated;


grant select
on public.group_members
to authenticated;


grant select, insert, update, delete
on public.busy_blocks
to authenticated;


grant select
on public.events
to authenticated;


-- Invitations are intentionally accessed through RPCs.
revoke all
on public.group_invites
from anon, authenticated;


-- =========================================================
-- RPC PERMISSIONS
-- =========================================================

revoke all
on function public.create_group_invite(uuid)
from public;

grant execute
on function public.create_group_invite(uuid)
to authenticated;


revoke all
on function public.get_group_invite_info(uuid)
from public;

grant execute
on function public.get_group_invite_info(uuid)
to anon, authenticated;


revoke all
on function public.accept_group_invite(uuid)
from public;

grant execute
on function public.accept_group_invite(uuid)
to authenticated;


revoke all
on function public.create_group_event(
  uuid,
  text,
  timestamptz,
  timestamptz
)
from public;

grant execute
on function public.create_group_event(
  uuid,
  text,
  timestamptz,
  timestamptz
)
to authenticated;


revoke all
on function public.update_group_event(
  uuid,
  text,
  timestamptz,
  timestamptz
)
from public;

grant execute
on function public.update_group_event(
  uuid,
  text,
  timestamptz,
  timestamptz
)
to authenticated;


revoke all
on function public.delete_group_event(uuid)
from public;

grant execute
on function public.delete_group_event(uuid)
to authenticated;


revoke all
on function public.rename_group(uuid, text)
from public;

grant execute
on function public.rename_group(uuid, text)
to authenticated;


revoke all
on function public.remove_group_member(uuid, uuid)
from public;

grant execute
on function public.remove_group_member(uuid, uuid)
to authenticated;


revoke all
on function public.leave_group(uuid)
from public;

grant execute
on function public.leave_group(uuid)
to authenticated;


revoke all
on function public.delete_group(uuid)
from public;

grant execute
on function public.delete_group(uuid)
to authenticated;