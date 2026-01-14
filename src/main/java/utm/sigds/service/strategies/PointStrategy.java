package utm.sigds.service.strategies;

import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;
import utm.sigds.infrastructure.entities.FeatureEntity;

@Component("PUNTO")
public class PointStrategy implements GeometryStrategy {

    @Override
    public void process(FeatureEntity feature) {
        Geometry geom = feature.getGeom();

        if (geom == null) {
            throw new IllegalArgumentException("La geometría del punto no puede ser nula.");
        }

        if (!(geom instanceof Point)) {
            // Aceptamos MultiPoint si tu lógica de negocio lo permite, si no, lanza error.
            if (!geom.getGeometryType().equalsIgnoreCase("Point")) {
                throw new IllegalArgumentException("La geometría debe ser de tipo PUNTO.");
            }
        }

        if (!geom.isValid()) {
            throw new IllegalArgumentException("La geometría del punto es topológicamente inválida.");
        }

        // Validación de Negocio: Coordenadas WGS84 válidas
        // Latitud: -90 a 90, Longitud: -180 a 180
        double x = geom.getCoordinate().getX(); // Longitud
        double y = geom.getCoordinate().getY(); // Latitud

        if (x < -180 || x > 180 || y < -90 || y > 90) {
            throw new IllegalArgumentException(
                String.format("Coordenadas fuera de rango WGS84: [%f, %f]", x, y)
            );
        }
    }
}