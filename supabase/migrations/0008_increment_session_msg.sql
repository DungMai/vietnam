-- Migration 0008 — atomic message counter increment
-- See lib/session/cookie.ts incrementDailyMessage

create or replace function increment_session_msg(session_id uuid)
returns integer
language sql as $$
    update anonymous_session
       set daily_msg_count = daily_msg_count + 1,
           last_seen_at = now()
     where id = session_id
    returning daily_msg_count
$$;
