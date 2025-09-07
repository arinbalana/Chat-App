package com.eazybyts.chat_application.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eazybyts.chat_application.dto.UserDto;
import com.eazybyts.chat_application.model.User;
import com.eazybyts.chat_application.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/online")
    public ResponseEntity<List<UserDto>> getOnlineUsers() {
        try {
            List<UserDto> onlineUsers = userService.getOnlineUsers();
            return ResponseEntity.ok(onlineUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        try {
            List<UserDto> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        try {
            Optional<User> userOptional = userService.findByUsername(username);
            if (userOptional.isPresent()) {
                UserDto userDto = userService.convertToDto(userOptional.get());
                return ResponseEntity.ok(userDto);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/status")
    public ResponseEntity<?> updateUserStatus(@RequestParam String username, 
                                            @RequestParam boolean isOnline) {
        try {
            userService.setUserOnlineStatus(username, isOnline);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Status updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to update status");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PutMapping("/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username,
                                      @RequestParam String email) {
        try {
            User updatedUser = userService.updateUser(username, email);
            UserDto userDto = userService.convertToDto(updatedUser);
            return ResponseEntity.ok(userDto);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        try {
            userService.deleteUser(username);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String query) {
        try {
            List<UserDto> allUsers = userService.getAllUsers();
            List<UserDto> filteredUsers = allUsers.stream()
                    .filter(user -> user.getUsername().toLowerCase().contains(query.toLowerCase()) ||
                                   user.getEmail().toLowerCase().contains(query.toLowerCase()))
                    .toList();
            return ResponseEntity.ok(filteredUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}