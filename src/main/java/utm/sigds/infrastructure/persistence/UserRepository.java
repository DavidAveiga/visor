package utm.sigds.infrastructure.persistence;

import utm.sigds.infrastructure.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    // Método mágico de JPA para buscar por email
    Optional<UserEntity> findByEmail(String email);
    Boolean existsByEmail(String email);
}