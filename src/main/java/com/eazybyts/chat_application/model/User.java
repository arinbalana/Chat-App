package com.eazybyts.chat_application.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotBlank(message = "Username cannot be empty")
	@Size(min = 3, max = 50)
	@Column(unique = true, nullable = false)
	private String username;
	
	@NotBlank(message = "Email cannot be empty")
	@Email(message = "Invalid email format")
	@Column(unique = true, nullable = false)
	private String email;
	
	@NotBlank(message = "Password cannot be empty")
	@Size(min = 6)
	@Column(nullable = false)
	private String password;
	
	@Column(name = "created_at", updatable = false, nullable = false)
	@CreationTimestamp
	private LocalDateTime createdAt;
	
	@Column(name = "is_online", nullable = false)
	private Boolean isOnline = false;
	
	@Column(name = "last_seen")
	private LocalDateTime lastSeen;
	

}
