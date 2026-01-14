package utm.sigds.service.implementation;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import utm.sigds.infrastructure.entities.UserEntity;
import utm.sigds.infrastructure.persistence.UserRepository;
import utm.sigds.service.interfaces.IAuthService;
import utm.sigds.shared.dtos.AuthRequestDTO;
import utm.sigds.shared.dtos.AuthResponseDTO;
import utm.sigds.shared.dtos.LoginRequestDTO;
import utm.sigds.shared.enums.UserRole;
import utm.sigds.shared.exceptions.UnauthorizedException;
import utm.sigds.shared.utils.JwtUtil;

@Service
public class AuthServiceImpl implements IAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponseDTO register(AuthRequestDTO request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El correo ya está registrado.");
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        // Asignamos rol por defecto si no viene en el request
        // Nota: AuthRequestDTO debería tener un campo 'role' o lo manejas aquí
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        } else {
            user.setRole(UserRole.VISUALIZADOR);
        }

        userRepository.save(user);

        // Generar token inmediatamente para auto-login
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return new AuthResponseDTO(token);
    }

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        // 1. Buscar usuario
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

        // 2. Verificar contraseña
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        // 3. Generar Token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return new AuthResponseDTO(token);
    }
}