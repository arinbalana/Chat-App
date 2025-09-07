package com.eazybyts.chat_application.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eazybyts.chat_application.dto.LoginRequest;
import com.eazybyts.chat_application.dto.RegisterRequest;
import com.eazybyts.chat_application.model.User;
import com.eazybyts.chat_application.service.JwtService;
import com.eazybyts.chat_application.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtService jwtService;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = userService.createUser(
                registerRequest.getUsername(),
                registerRequest.getEmail(),
                registerRequest.getPassword()
            );
            
            String jwt = jwtService.generateToken(user.getUsername());
            userService.setUserOnlineStatus(user.getUsername(), true);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("type", "Bearer");
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("message", "User registered successfully!");
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Registration failed. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            boolean isAuthenticated = userService.authenticateUser(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            );
            
            if (!isAuthenticated) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("message", "Invalid username or password!");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            User user = userService.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String jwt = jwtService.generateToken(user.getUsername());
            userService.setUserOnlineStatus(user.getUsername(), true);
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("type", "Bearer");
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("message", "Login successful!");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Login failed. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            String username = jwtService.getUsernameFromToken(jwt);
            
            userService.setUserOnlineStatus(username, false);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Logout successful!");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Logout failed.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            
            if (jwtService.validateToken(jwt)) {
                String username = jwtService.getUsernameFromToken(jwt);
                User user = userService.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                
                Map<String, Object> response = new HashMap<>();
                response.put("valid", true);
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "Invalid token");
                
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("message", "Token validation failed");
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}
