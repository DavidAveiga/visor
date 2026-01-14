package utm.sigds.presentation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utm.sigds.service.interfaces.IAuthService;
import utm.sigds.shared.dtos.AuthRequestDTO;
import utm.sigds.shared.dtos.AuthResponseDTO;
import utm.sigds.shared.dtos.LoginRequestDTO;

@RestController
@RequestMapping("/api/v1/auth")
// @CrossOrigin eliminado, se maneja globalmente en SecurityConfig
public class AuthController {

    private final IAuthService authService;

    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody AuthRequestDTO request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (IllegalArgumentException e) {
            // El usuario ya existe o datos inválidos
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        // Las excepciones (como UnauthorizedException) serán manejadas por el GlobalExceptionHandler
        // o devolverán 403/500 por defecto si no hay handler, pero el flujo es correcto.
        return ResponseEntity.ok(authService.login(request));
    }
}