create table watch_target (
  id uuid primary key,
  name varchar(255) not null,
  url varchar(2048) not null,
  enabled boolean not null,
  fetch_mode varchar(32) not null,
  css_selector varchar(512),
  ignore_regexes ${lob},
  interval_seconds bigint not null,
  next_run_at timestamp,
  last_run_at timestamp,
  last_status varchar(32) not null,
  last_error ${lob}
);

create index idx_watch_target_enabled_next_run
  on watch_target(enabled, next_run_at);

create table snapshot (
  id uuid primary key,
  target_id uuid not null,
  fetched_at timestamp not null,
  http_status integer,
  etag varchar(512),
  last_modified varchar(512),
  content_hash varchar(64) not null,
  normalized_text ${lob} not null,
  raw_html ${lob}
);

create index idx_snapshot_target_fetched
  on snapshot(target_id, fetched_at);

create table change_event (
  id uuid primary key,
  target_id uuid not null,
  created_at timestamp not null,
  old_snapshot_id uuid,
  new_snapshot_id uuid not null,
  added_lines integer not null,
  removed_lines integer not null,
  unified_diff ${lob} not null
);

create index idx_change_event_target_created
  on change_event(target_id, created_at);
