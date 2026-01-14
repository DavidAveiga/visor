package utm.sigds.service.interfaces;

import utm.sigds.shared.dtos.AuthRequestDTO;
import utm.sigds.shared.dtos.AuthResponseDTO;
import utm.sigds.shared.dtos.LoginRequestDTO; // <--- Importar nuevo DTO

public interface IAuthService {
    // El registro sigue usando AuthRequestDTO (que tiene nombre, email, pass)
    AuthResponseDTO register(AuthRequestDTO request);
    
    // El login ahora usa LoginRequestDTO (solo email, pass)
    AuthResponseDTO login(LoginRequestDTO request);
}