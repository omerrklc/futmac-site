-- Okunma sayacı, haberin editoryal güncellenme tarihini değiştirmemeli.
-- Mevcut içerikler, sayaçlar ve erişim politikaları korunur.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'articles' and tg_op = 'UPDATE' then
    if (to_jsonb(new) - array['view_count','updated_at','updated_by']::text[])
       = (to_jsonb(old) - array['view_count','updated_at','updated_by']::text[])
       and to_jsonb(new)->'view_count' is distinct from to_jsonb(old)->'view_count' then
      new.updated_at = old.updated_at;
      new.updated_by = old.updated_by;
      return new;
    end if;
    new.updated_by = coalesce(auth.uid(), old.updated_by);
  end if;
  new.updated_at = now();
  return new;
end;
$$;
