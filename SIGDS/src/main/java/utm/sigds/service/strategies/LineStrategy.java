package utm.sigds.service.strategies;

import org.locationtech.jts.geom.Geometry;
import org.springframework.stereotype.Component;
import utm.sigds.infrastructure.entities.FeatureEntity;

@Component("LINEA")
public class LineStrategy implements GeometryStrategy {

    @Override
    public void process(FeatureEntity feature) {
        Geometry geom = feature.getGeom();

        if (geom == null) {
            throw new IllegalArgumentException("La geometría de la línea no puede ser nula.");
        }

        String type = geom.getGeometryType();
        if (!type.contains("LineString")) { // Acepta LineString y MultiLineString
            throw new IllegalArgumentException("La geometría debe ser de tipo LÍNEA (LineString).");
        }

        if (!geom.isValid()) {
            // Intentar corrección básica si es necesario, o rechazar
            throw new IllegalArgumentException("La geometría de la línea es inválida.");
        }

        // Validación de Negocio: La línea debe tener longitud
        if (geom.getLength() <= 0) {
            throw new IllegalArgumentException("La línea debe tener una longitud mayor a 0.");
        }
        
        // Validación: Mínimo 2 puntos
        if (geom.getCoordinates().length < 2) {
             throw new IllegalArgumentException("Una línea válida debe tener al menos 2 coordenadas.");
        }
    }
}