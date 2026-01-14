package utm.sigds.service.implementation;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.geotools.api.data.DataStore;
import org.geotools.api.data.DataStoreFinder;
import org.geotools.api.data.FeatureSource;
import org.geotools.api.feature.Property;
import org.geotools.api.feature.simple.SimpleFeature;
import org.geotools.api.feature.simple.SimpleFeatureType;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.locationtech.jts.geom.Geometry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import utm.sigds.infrastructure.entities.FeatureEntity;
import utm.sigds.infrastructure.entities.LayerEntity;
import utm.sigds.infrastructure.persistence.FeatureRepository;
import utm.sigds.infrastructure.persistence.LayerRepository;
import utm.sigds.service.interfaces.ILayerService;
import utm.sigds.service.strategies.GeometryStrategy;
import utm.sigds.shared.enums.GeometryType;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class LayerServiceImpl implements ILayerService {

    private final LayerRepository layerRepository;
    private final FeatureRepository featureRepository;
    private final Map<String, GeometryStrategy> strategies; // Inyección de mapa de estrategias
    private final GeoServerServiceImpl geoServerService;    // Inyección del servicio de GeoServer
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LayerServiceImpl(LayerRepository layerRepository,
                            FeatureRepository featureRepository,
                            Map<String, GeometryStrategy> strategies,
                            GeoServerServiceImpl geoServerService) {
        this.layerRepository = layerRepository;
        this.featureRepository = featureRepository;
        this.strategies = strategies;
        this.geoServerService = geoServerService;
    }

    @Override
    public List<LayerEntity> retrieveAllLayers() {
        return layerRepository.findAll();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LayerEntity createLayerFromZip(String name, String color, MultipartFile zipFile) throws IOException {
        Path tempDir = Files.createTempDirectory("sigds_upload_" + UUID.randomUUID());
        DataStore dataStore = null;

        try {
            // 1. Descomprimir y buscar el .shp
            File shpFile = unzipAndFindShp(zipFile, tempDir);
            if (shpFile == null) throw new IllegalArgumentException("El archivo ZIP no contiene un .shp válido.");

            // 2. Conectar GeoTools al Shapefile
            Map<String, Object> params = new HashMap<>();
            params.put("url", shpFile.toURI().toURL());
            dataStore = DataStoreFinder.getDataStore(params);
            
            if (dataStore == null) throw new IOException("No se pudo leer el archivo Shapefile (DataStore nulo).");

            String typeName = dataStore.getTypeNames()[0];
            FeatureSource<SimpleFeatureType, SimpleFeature> featureSource = dataStore.getFeatureSource(typeName);
            FeatureCollection<SimpleFeatureType, SimpleFeature> collection = featureSource.getFeatures();
            SimpleFeatureType schema = featureSource.getSchema();

            // 3. Detectar Tipo de Geometría
            GeometryType detectedType = detectGeometryType(schema);
            
            // 4. Crear y Guardar la Capa (Metadatos)
            LayerEntity layer = new LayerEntity();
            layer.setName(sanitizeLayerName(name)); // Limpiar nombre para GeoServer
            layer.setColor(color);
            layer.setGeometryType(detectedType);
            layer.setIsVisible(true);
            
            LayerEntity savedLayer = layerRepository.save(layer);

            // 5. Procesar Features (Geometrías y Atributos)
            List<FeatureEntity> entitiesToSave = new ArrayList<>();
            String geomFieldName = schema.getGeometryDescriptor().getLocalName();
            
            // Obtener la estrategia correspondiente (PUNTO, LINEA, POLIGONO)
            GeometryStrategy strategy = strategies.get(detectedType.name());
            
            if (strategy == null) {
                // Fallback o log de advertencia si no hay estrategia (aunque debería haber)
                System.out.println("ADVERTENCIA: No se encontró estrategia de validación para " + detectedType);
            }

            try (FeatureIterator<SimpleFeature> features = collection.features()) {
                while (features.hasNext()) {
                    SimpleFeature simpleFeature = features.next();
                    Geometry geom = (Geometry) simpleFeature.getDefaultGeometry();
                    
                    if (geom == null) continue; // Ignorar geometrías nulas
                    
                    // Asegurar SRID 4326 (WGS84)
                    geom.setSRID(4326);

                    // Extraer atributos a JSON
                    Map<String, Object> attributes = new HashMap<>();
                    for (Property prop : simpleFeature.getProperties()) {
                        String propName = prop.getName().toString();
                        if (!propName.equals(geomFieldName)) {
                            attributes.put(propName, prop.getValue());
                        }
                    }
                    String propertiesJson = objectMapper.writeValueAsString(attributes);

                    // Crear Entidad Feature
                    FeatureEntity featureEntity = new FeatureEntity(savedLayer, geom);
                    featureEntity.setProperties(propertiesJson);

                    // 6. VALIDACIÓN CON STRATEGY PATTERN
                    if (strategy != null) {
                        strategy.process(featureEntity); // Esto lanza excepción si es inválido
                    }

                    entitiesToSave.add(featureEntity);
                }
            }

            // Guardado en lote (Batch)
            featureRepository.saveAll(entitiesToSave);

            // 7. PUBLICAR EN GEOSERVER
            // Esta llamada es asíncrona o síncrona según tu implementación, 
            // pero es vital para que el frontend vea la capa WMS.
            geoServerService.publishLayer(savedLayer.getName());

            return savedLayer;

        } catch (Exception e) {
            // El @Transactional hará rollback de la capa y features guardados en DB
            throw new IOException("Error procesando la capa: " + e.getMessage(), e);
        } finally {
            if (dataStore != null) dataStore.dispose();
            // Limpieza opcional del directorio temporal (recomendado)
            // FileUtils.deleteDirectory(tempDir.toFile()); 
        }
    }

    @Override
    public void deleteLayer(String layerId) {
        // Aquí podrías agregar geoServerService.removeLayer(...)
        layerRepository.deleteById(UUID.fromString(layerId));
    }

    // --- Métodos Auxiliares Privados ---

    private GeometryType detectGeometryType(SimpleFeatureType schema) {
        String geomBinding = schema.getGeometryDescriptor().getType().getBinding().getSimpleName();
        
        if (geomBinding.contains("Point")) {
            return GeometryType.PUNTO;
        } else if (geomBinding.contains("Line")) {
            return GeometryType.LINEA;
        } else if (geomBinding.contains("Polygon")) {
            return GeometryType.POLIGONO;
        }
        // Default o error
        throw new IllegalArgumentException("Tipo de geometría no soportado: " + geomBinding);
    }

    private String sanitizeLayerName(String name) {
        // GeoServer prefiere nombres sin espacios y caracteres especiales
        return name.trim().replaceAll("\\s+", "_").toLowerCase();
    }

    private File unzipAndFindShp(MultipartFile zipFile, Path destDir) throws IOException {
        File shpFile = null;
        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                File newFile = new File(destDir.toFile(), zipEntry.getName());
                
                // Seguridad contra Zip Slip
                if (!newFile.toPath().normalize().startsWith(destDir.normalize())) {
                    throw new IOException("Entrada ZIP fuera del directorio destino");
                }
                
                if (zipEntry.isDirectory()) {
                    newFile.mkdirs();
                } else {
                    File parent = newFile.getParentFile();
                    if (parent != null) parent.mkdirs();
                    Files.copy(zis, newFile.toPath());
                    
                    if (newFile.getName().toLowerCase().endsWith(".shp")) {
                        shpFile = newFile;
                    }
                }
                zipEntry = zis.getNextEntry();
            }
        }
        return shpFile;
    }
}