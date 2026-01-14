package utm.sigds.shared.dtos;

import lombok.Data;
import utm.sigds.shared.enums.GeometryType;

@Data
public class LayerCreationDTO {
    private String name;
    // Este Enum define si es PUNTO, LINEA o POLIGONO
    private GeometryType type; 
    private String color;
}