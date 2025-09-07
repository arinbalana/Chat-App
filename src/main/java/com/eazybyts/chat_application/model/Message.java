package com.eazybyts.chat_application.model;


import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(nullable = false)
	private String content;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id", nullable = false)
	private User sender;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "receiver_id")
	private User receiver;
	
	@Column(name = "chat_room")
	private String chatRoom;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private MessageType type;
	
	@Column(name = "timestamp", updatable = false, nullable = false)
	@CreationTimestamp
	private LocalDateTime timestamp;

}
