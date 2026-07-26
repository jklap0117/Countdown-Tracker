-- Scheduling for the reminder job.
--   pg_cron — the hourly trigger.
--   pg_net  — lets the schedule call the Edge Function over HTTP.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
