package utm.sigds.infrastructure.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import utm.sigds.shared.enums.GeometryType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "layers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LayerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String color;

    // EL ERROR ESTABA AQUÍ: El nombre del campo define el setter
    // Si se llama "geometryType", Lombok crea "setGeometryType()"
    @Enumerated(EnumType.STRING)
    @Column(name = "geometry_type", nullable = false)
    private GeometryType geometryType; 

    @Column(name = "is_visible")
    private Boolean isVisible = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructor auxiliar útil para el servicio
    public static LayerEntity createNew(String name, GeometryType type, String color) {
        LayerEntity layer = new LayerEntity();
        layer.setName(name);
        layer.setGeometryType(type);
        layer.setColor(color);
        layer.setIsVisible(true);
        return layer;
    }
}