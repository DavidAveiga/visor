package utm.sigds.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import utm.sigds.infrastructure.entities.FeatureEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeatureRepository extends JpaRepository<FeatureEntity, UUID> {
    
    List<FeatureEntity> findByLayerId(UUID layerId);

@Query(value = "SELECT * FROM features f WHERE CAST(f.properties AS TEXT) ILIKE :query", nativeQuery = true)
List<FeatureEntity> searchByText(@Param("query") String query);
}