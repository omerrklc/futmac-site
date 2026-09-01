-- FUTMAC kayıtlı kullanıcı forumu. Anonimlik yalnızca ziyaretçiye gösterilen adı gizler.
alter table public.profiles add column if not exists forum_nickname text;
create unique index if not exists profiles_forum_nickname_unique
  on public.profiles (lower(forum_nickname)) where forum_nickname is not null;

-- Yeni forum üyelerinin seçtiği rumuzu e-posta onayından önce profile güvenli biçimde bağla.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare requested_nickname text:=nullif(trim(new.raw_user_meta_data ->> 'display_name'),'');
        display_label text:=coalesce(requested_nickname,split_part(new.email,'@',1));
begin
  if requested_nickname is not null and (char_length(requested_nickname) not between 3 and 30 or requested_nickname !~ '^[[:alnum:]_ .ÇĞİÖŞÜçğıöşü-]+$') then
    raise exception 'forum_invalid_nickname';
  end if;
  insert into public.profiles(id,display_name,forum_nickname,role) values(new.id,display_label,requested_nickname,'viewer');
  return new;
end; $$;

create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 120),
  body text not null check (char_length(body) between 10 and 5000),
  author_id uuid not null references auth.users(id) on delete cascade,
  is_anonymous boolean not null default false,
  status text not null default 'active' check (status in ('active','locked','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 3000),
  author_id uuid not null references auth.users(id) on delete cascade,
  is_anonymous boolean not null default false,
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forum_topics_recent_idx on public.forum_topics (updated_at desc) where status <> 'hidden';
create index if not exists forum_replies_topic_idx on public.forum_replies (topic_id, created_at) where status = 'visible';
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;
revoke all on public.forum_topics, public.forum_replies from anon, authenticated;

create or replace function public.forum_public_name(user_id uuid, anonymous boolean)
returns text language sql stable security definer set search_path=public,pg_temp as $$
  select case when anonymous then 'Anonim Üye'
    else coalesce(nullif(p.forum_nickname,''), nullif(p.display_name,''), 'Forum Üyesi') end
  from public.profiles p where p.id = user_id;
$$;
revoke all on function public.forum_public_name(uuid,boolean) from public;

create or replace function public.list_forum_topics(page_size integer default 30, page_offset integer default 0)
returns table(id uuid,title text,body_preview text,author_name text,is_anonymous boolean,reply_count bigint,created_at timestamptz,updated_at timestamptz,locked boolean)
language sql stable security definer set search_path=public,pg_temp as $$
  select t.id,t.title,left(t.body,220),public.forum_public_name(t.author_id,t.is_anonymous),t.is_anonymous,
    (select count(*) from public.forum_replies r where r.topic_id=t.id and r.status='visible'),
    t.created_at,t.updated_at,t.status='locked'
  from public.forum_topics t where t.status in ('active','locked')
  order by t.updated_at desc limit least(greatest(page_size,1),50) offset greatest(page_offset,0);
$$;
revoke all on function public.list_forum_topics(integer,integer) from public;
grant execute on function public.list_forum_topics(integer,integer) to anon, authenticated;

create or replace function public.get_forum_topic(topic_uuid uuid)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object(
    'topic',jsonb_build_object('id',t.id,'title',t.title,'body',t.body,'author_name',public.forum_public_name(t.author_id,t.is_anonymous),'is_anonymous',t.is_anonymous,'created_at',t.created_at,'locked',t.status='locked'),
    'replies',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'body',r.body,'author_name',public.forum_public_name(r.author_id,r.is_anonymous),'is_anonymous',r.is_anonymous,'created_at',r.created_at) order by r.created_at) from public.forum_replies r where r.topic_id=t.id and r.status='visible'),'[]'::jsonb)
  ) from public.forum_topics t where t.id=topic_uuid and t.status in ('active','locked');
$$;
revoke all on function public.get_forum_topic(uuid) from public;
grant execute on function public.get_forum_topic(uuid) to anon, authenticated;

create or replace function public.create_forum_topic(topic_title text, topic_body text, anonymous boolean default false)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'forum_login_required'; end if;
  if char_length(trim(topic_title)) not between 5 and 120 or char_length(trim(topic_body)) not between 10 and 5000 then raise exception 'forum_invalid_content'; end if;
  if (select count(*) from public.forum_topics where author_id=auth.uid() and created_at>now()-interval '1 hour') >= 5 then raise exception 'forum_rate_limit'; end if;
  insert into public.forum_topics(title,body,author_id,is_anonymous) values(trim(topic_title),trim(topic_body),auth.uid(),coalesce(anonymous,false)) returning id into new_id;
  return new_id;
end; $$;
revoke all on function public.create_forum_topic(text,text,boolean) from public;
grant execute on function public.create_forum_topic(text,text,boolean) to authenticated;

create or replace function public.create_forum_reply(topic_uuid uuid, reply_body text, anonymous boolean default false)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'forum_login_required'; end if;
  if char_length(trim(reply_body)) not between 2 and 3000 then raise exception 'forum_invalid_content'; end if;
  if not exists(select 1 from public.forum_topics where id=topic_uuid and status='active') then raise exception 'forum_topic_locked'; end if;
  if (select count(*) from public.forum_replies where author_id=auth.uid() and created_at>now()-interval '1 hour') >= 30 then raise exception 'forum_rate_limit'; end if;
  insert into public.forum_replies(topic_id,body,author_id,is_anonymous) values(topic_uuid,trim(reply_body),auth.uid(),coalesce(anonymous,false)) returning id into new_id;
  update public.forum_topics set updated_at=now() where id=topic_uuid;
  return new_id;
end; $$;
revoke all on function public.create_forum_reply(uuid,text,boolean) from public;
grant execute on function public.create_forum_reply(uuid,text,boolean) to authenticated;

create or replace function public.update_forum_nickname(new_nickname text)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare clean text:=trim(new_nickname);
begin
  if auth.uid() is null then raise exception 'forum_login_required'; end if;
  if char_length(clean) not between 3 and 30 or clean !~ '^[[:alnum:]_ .ÇĞİÖŞÜçğıöşü-]+$' then raise exception 'forum_invalid_nickname'; end if;
  if exists(select 1 from public.profiles where id<>auth.uid() and lower(coalesce(forum_nickname,display_name))=lower(clean)) then raise exception 'forum_nickname_taken'; end if;
  update public.profiles set forum_nickname=clean where id=auth.uid(); return clean;
end; $$;
revoke all on function public.update_forum_nickname(text) from public;
grant execute on function public.update_forum_nickname(text) to authenticated;

create or replace function public.moderate_forum_item(item_type text,item_id uuid,new_status text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.is_admin() then raise exception 'forum_admin_required'; end if;
  if item_type='topic' and new_status in ('active','locked','hidden') then update public.forum_topics set status=new_status,updated_at=now() where id=item_id;
  elsif item_type='reply' and new_status in ('visible','hidden') then update public.forum_replies set status=new_status,updated_at=now() where id=item_id;
  else raise exception 'forum_invalid_moderation'; end if;
end; $$;
revoke all on function public.moderate_forum_item(text,uuid,text) from public;
grant execute on function public.moderate_forum_item(text,uuid,text) to authenticated;
