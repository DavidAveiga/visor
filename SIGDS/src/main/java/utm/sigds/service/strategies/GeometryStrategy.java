package utm.sigds.service.strategies; 

import utm.sigds.infrastructure.entities.FeatureEntity;

public interface GeometryStrategy {
    void process(FeatureEntity feature);
}