package utm.sigds;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
// CORRECCIÓN: El paquete correcto es com.bedatadriven, no com.fasterxml
import com.bedatadriven.jackson.datatype.jts.JtsModule; 

@SpringBootApplication
public class SigdsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SigdsApplication.class, args);
    }

    /**
     * Este Bean permite que el Backend convierta automáticamente
     * las geometrías complejas (Point, Polygon) a GeoJSON para el Frontend.
     */
    @Bean
    public JtsModule jtsModule() {
        return new JtsModule();
    }
}