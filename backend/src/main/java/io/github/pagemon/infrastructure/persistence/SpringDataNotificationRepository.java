package io.github.pagemon.infrastructure.persistence;

import io.github.pagemon.domain.NotificationChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataNotificationRepository extends JpaRepository<NotificationtEntity, UUID> {
    Optional<NotificationtEntity> findByChannel(NotificationChannel notificationChannel);
}
