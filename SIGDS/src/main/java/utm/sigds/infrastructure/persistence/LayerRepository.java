package utm.sigds.infrastructure.persistence;

import utm.sigds.infrastructure.entities.LayerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface LayerRepository extends JpaRepository<LayerEntity, UUID> {
    List<LayerEntity> findByIsVisibleTrue();
}