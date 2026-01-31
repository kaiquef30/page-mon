package io.github.pagemon.infrastructure.time;

import io.github.pagemon.application.ports.ClockPort;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class SystemClockPort implements ClockPort {
  @Override
  public Instant now() {
      return Instant.now();
  }
}
