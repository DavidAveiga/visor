package utm.sigds.infrastructure.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Geometry;

import java.util.UUID;

@Entity
@Table(name = "features")
@Data
@NoArgsConstructor
@AllArgsConstructor // Genera constructor con TODOS los campos
public class FeatureEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layer_id", nullable = false)
    @JsonIgnore
    private LayerEntity layer;

    // GeoTools necesita guardar JSON aquí
    @Column(columnDefinition = "jsonb")
    private String properties;

    // PostGIS usa este campo
    @Column(name = "geom", columnDefinition = "geometry(Geometry,4326)")
    private Geometry geom;

    // --- CONSTRUCTOR MANUAL (NECESARIO PARA CORREGIR EL ERROR) ---
    // Este es el que busca tu LayerServiceImpl
    public FeatureEntity(LayerEntity layer, Geometry geom) {
        this.layer = layer;
        this.geom = geom;
    }
}