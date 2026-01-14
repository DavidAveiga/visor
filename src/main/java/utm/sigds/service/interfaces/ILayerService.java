package utm.sigds.service.interfaces;

import utm.sigds.infrastructure.entities.LayerEntity;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface ILayerService {
    List<LayerEntity> retrieveAllLayers();
    
    // Nueva firma para manejo de archivos
    LayerEntity createLayerFromZip(String name, String color, MultipartFile file) throws IOException;
    
    void deleteLayer(String layerId);
}