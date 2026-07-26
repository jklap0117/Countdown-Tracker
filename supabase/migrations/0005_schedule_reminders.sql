-- Hourly, not daily.
--
-- Each push subscription stores the IANA timezone of the device that made it,
-- and the function only sends to a device when it is locally 9 AM. Waking every
-- hour is what lets that be correct for everyone at once, through DST and while
-- travelling, with no code change.
--
-- Cost: ~720 runs/month against a 500,000 free-plan quota for Edge Function
-- invocations.
--
-- The secret is read from Vault at call time rather than baked into the job
-- definition, so rotating it needs no change here.

select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $job$
  select net.http_post(
    url := 'https://pdimluxiiziyadhxmkvo.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
