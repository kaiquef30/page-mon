ALTER TABLE watch_target
  ALTER COLUMN ignore_regexes SET DATA TYPE ${lob};

ALTER TABLE watch_target
  ALTER COLUMN last_error SET DATA TYPE ${lob};

ALTER TABLE snapshot
  ALTER COLUMN normalized_text SET DATA TYPE ${lob};

ALTER TABLE snapshot
  ALTER COLUMN raw_html SET DATA TYPE ${lob};

ALTER TABLE change_event
  ALTER COLUMN unified_diff SET DATA TYPE ${lob};
