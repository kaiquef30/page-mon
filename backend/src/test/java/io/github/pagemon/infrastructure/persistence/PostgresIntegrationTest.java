package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.domain.FetchMode;
import io.github.pagemon.domain.TargetStatus;
import io.github.pagemon.domain.WatchTarget;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
@SpringBootTest
@ActiveProfiles("postgres")
class PostgresIntegrationTest {

  @Container
  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17")
      .withDatabaseName("pagemon")
      .withUsername("pagemon")
      .withPassword("pagemon");

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  
  @Autowired
  JpaTargetStore store;

  @Test
  void savesAndLoadsTarget() {
    WatchTarget t = new WatchTarget(
        UUID.randomUUID(),
        "teste",
        URI.create("https://example.com"),
        true,
        FetchMode.AUTO,
        null,
        List.of("foo"),
        Duration.ofMinutes(5),
        Instant.now(),
        null,
        TargetStatus.OK,
        null
    );
    var saved = store.save(t);
    var loaded = store.findById(saved.id()).orElseThrow();
    assertEquals("teste", loaded.name());
    assertEquals("https://example.com", loaded.url().toString());
  }
}
