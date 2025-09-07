package com.eazybyts.chat_application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.eazybyts.chat_application.dto.UserDto;
import com.eazybyts.chat_application.model.User;
import com.eazybyts.chat_application.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class UserService {
	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private PasswordEncoder passwordEncoder;
	
	public User createUser(String username, String email, String password) {
	    if (userRepository.existsByUsername(username)) {
	        throw new RuntimeException("Username already exists!");
	    }
	    if (userRepository.existsByEmail(email)) {
	        throw new RuntimeException("Email already exists!");
	    }

	    User user = new User();
	    user.setUsername(username);
	    user.setEmail(email);
	    // ✅ Encode password before saving
	    user.setPassword(passwordEncoder.encode(password));
	    user.setCreatedAt(LocalDateTime.now());
	    user.setIsOnline(false);

	    return userRepository.save(user);
	}

	
	public Optional<User> findByUsername(String username){
		return userRepository.findByUsername(username);
	}
	
	public Optional<User> findByEmail(String email){
		return userRepository.findByEmail(email);
	}
	
	public List<UserDto> getOnlineUsers() {
	    List<User> onlineUsers = userRepository.findByIsOnlineTrue();
	    List<UserDto> dtos = new ArrayList<>();

	    for (User user : onlineUsers) {
	        dtos.add(convertToDto(user));
	    }

	    return dtos;
	}
	
	public List<UserDto> getAllUsers() {
	    List<User> users = userRepository.findAll();
	    List<UserDto> userDtos = new ArrayList<>();

	    for (User user : users) {
	        userDtos.add(convertToDto(user));
	    }

	    return userDtos;
	}
	
	public void setUserOnlineStatus(String username, boolean isOnline) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setIsOnline(isOnline);
            if (!isOnline) {
                user.setLastSeen(LocalDateTime.now());
            }
            userRepository.save(user);
        }
    }
	
	public boolean authenticateUser(String username, String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return passwordEncoder.matches(password, user.getPassword());
        }
        return false;
    }
	
	public UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setIsOnline(user.getIsOnline());
        dto.setLastSeen(user.getLastSeen());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
	
	public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
	
	public User updateUser(String username, String email) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setEmail(email);
            return userRepository.save(user);
        }
        throw new RuntimeException("User not found!");
    }
	
	public void deleteUser(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            userRepository.delete(userOptional.get());
        } else {
            throw new RuntimeException("User not found!");
        }
    }


}
