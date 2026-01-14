package utm.sigds.presentation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utm.sigds.infrastructure.entities.FeatureEntity;
import utm.sigds.infrastructure.persistence.FeatureRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/features")
public class FeatureController {

    private final FeatureRepository featureRepository;

    public FeatureController(FeatureRepository featureRepository) {
        this.featureRepository = featureRepository;
    }

    // Endpoint de Búsqueda para la barra lateral del Frontend
    // Ejemplo de uso: GET /api/v1/features/search?q=facultad
    @GetMapping("/search")
    public ResponseEntity<List<FeatureEntity>> searchFeatures(@RequestParam("q") String query) {
        // Agregamos los comodines para el ILIKE aquí (solución java-side)
        String searchTerm = "%" + query + "%";
        List<FeatureEntity> results = featureRepository.searchByText(searchTerm);
        return ResponseEntity.ok(results);
    }

    // Nota: El endpoint 'saveFeatures' (batch) se mantiene si lo necesitas para cargas masivas,
    // pero para archivos ZIP ya usas LayerService.
}