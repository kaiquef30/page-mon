CREATE INDEX IF NOT EXISTS idx_watch_target_last_status ON watch_target(last_status);

CREATE INDEX IF NOT EXISTS idx_change_event_created_desc ON change_event(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_target_hash ON snapshot(target_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_snapshot_fetched_at ON snapshot(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_change_event_target_id ON change_event(target_id);
