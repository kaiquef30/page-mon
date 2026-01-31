package io.github.pagemon.application.ports;

import java.time.Instant;

public interface ClockPort {
  Instant now();
}
