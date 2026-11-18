alter table public.directory_users
add column if not exists password_hash varchar(255);
