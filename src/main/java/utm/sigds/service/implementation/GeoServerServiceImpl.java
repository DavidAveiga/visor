package utm.sigds.service.implementation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class GeoServerServiceImpl {

    @Value("${geoserver.url}")
    private String geoserverUrl;

    @Value("${geoserver.user}")
    private String user;

    @Value("${geoserver.password}")
    private String password;

    @Value("${geoserver.workspace}")
    private String workspace;

    @Value("${geoserver.datastore}")
    private String datastore;

    private final RestTemplate restTemplate = new RestTemplate();

    public void publishLayer(String layerName) {
        // 1. Crear FeatureType (Capa) en GeoServer apuntando a la tabla PostGIS
        String url = String.format("%s/rest/workspaces/%s/datastores/%s/featuretypes", 
                                   geoserverUrl, workspace, datastore);
        
        String xmlBody = "<featureType><name>" + layerName + "</name></featureType>";
        
        HttpHeaders headers = createHeaders();
        headers.set("Content-Type", "application/xml");
        
        HttpEntity<String> request = new HttpEntity<>(xmlBody, headers);
        
        try {
            restTemplate.postForEntity(url, request, String.class);
            System.out.println("Capa " + layerName + " publicada en GeoServer.");
        } catch (Exception e) {
            System.err.println("Error publicando capa en GeoServer (puede que ya exista): " + e.getMessage());
        }
    }
    
    // Método auxiliar para Auth Básica
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String auth = user + ":" + password;
        byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.US_ASCII));
        String authHeader = "Basic " + new String(encodedAuth);
        headers.set("Authorization", authHeader);
        return headers;
    }
}