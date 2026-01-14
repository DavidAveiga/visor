package utm.sigds.shared.dtos;

import lombok.Data;
import utm.sigds.shared.enums.GeometryType;
import java.util.UUID;

@Data
public class LayerResponseDTO {
    private UUID id;
    private String name;
    private String color;
    private GeometryType geometryType;
    private Boolean isVisible;
    // No incluimos fechas ni datos internos sensibles
}