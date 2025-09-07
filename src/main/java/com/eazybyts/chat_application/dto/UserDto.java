package com.eazybyts.chat_application.dto;

import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private String username;
    private String email;
    private Boolean isOnline;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
    
    public UserDto() {}
    
    public UserDto(Long id, String username, String email, Boolean isOnline) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.isOnline = isOnline;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }
    
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
