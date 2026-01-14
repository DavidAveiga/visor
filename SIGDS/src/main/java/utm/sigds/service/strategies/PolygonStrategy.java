package utm.sigds.service.strategies;

import org.locationtech.jts.geom.Geometry;
import org.springframework.stereotype.Component;
import utm.sigds.infrastructure.entities.FeatureEntity;

@Component("POLIGONO")
public class PolygonStrategy implements GeometryStrategy {

    @Override
    public void process(FeatureEntity feature) {
        Geometry geom = feature.getGeom();
        
        if (geom == null) {
            throw new IllegalArgumentException("La geometría del polígono no puede ser nula.");
        }
        
        if (!geom.isValid()) {
            // Intenta reparar la geometría (ej. buffer 0)
            feature.setGeom(geom.buffer(0));
        }

        // Validación adicional: Area mínima
        if (geom.getArea() <= 0) {
            throw new IllegalArgumentException("El polígono debe tener área positiva.");
        }
    }
}