package utm.sigds.presentation;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Importante
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import utm.sigds.infrastructure.entities.LayerEntity;
import utm.sigds.service.interfaces.ILayerService;
import utm.sigds.shared.dtos.LayerResponseDTO;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/layers")
// @CrossOrigin eliminado, debe manejarse en SecurityConfig
public class LayerController {

    private final ILayerService layerService;

    public LayerController(ILayerService layerService) {
        this.layerService = layerService;
    }

    @GetMapping
    public ResponseEntity<List<LayerResponseDTO>> getAllLayers() {
        List<LayerEntity> layers = layerService.retrieveAllLayers();
        // Mapeo manual o usar ModelMapper
        List<LayerResponseDTO> dtos = layers.stream().map(l -> {
            LayerResponseDTO dto = new LayerResponseDTO();
            dto.setId(l.getId());
            dto.setName(l.getName());
            dto.setColor(l.getColor());
            dto.setGeometryType(l.getGeometryType());
            dto.setIsVisible(l.getIsVisible());
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')") // Solo admins suben capas
    public ResponseEntity<?> uploadLayer(
            @RequestParam("name") String name,
            @RequestParam("color") String color,
            @RequestParam("file") MultipartFile file) {
        try {
            LayerEntity newLayer = layerService.createLayerFromZip(name, color, file);
            // Devolver DTO, no entidad
            return ResponseEntity.ok("Capa creada y publicada: " + newLayer.getId());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{layerId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')") // Solo super admin borra
    public ResponseEntity<?> deleteLayer(@PathVariable String layerId) {
        layerService.deleteLayer(layerId);
        return ResponseEntity.ok().build();
    }
}