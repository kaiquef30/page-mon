create table notification (
  id uuid primary key,
  channel varchar(32) not null unique,
  enabled boolean not null,
  webhook_url varchar(2048),
  max_diff_chars integer not null,
  created_at timestamp not null,
  updated_at timestamp not null
);

create index idx_notification_channel
  on notification(channel);
