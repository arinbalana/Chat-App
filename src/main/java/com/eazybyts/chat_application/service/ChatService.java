package com.eazybyts.chat_application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.eazybyts.chat_application.dto.MessageDto;
import com.eazybyts.chat_application.model.Message;
import com.eazybyts.chat_application.model.MessageType;
import com.eazybyts.chat_application.model.User;
import com.eazybyts.chat_application.repository.MessageRepository;
import com.eazybyts.chat_application.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class ChatService {
	@Autowired
	private MessageRepository messageRepository;
	
	@Autowired
	private UserRepository userRepository;
	
	public Message saveMessage(MessageDto messageDto) {
        Optional<User> senderOptional = userRepository.findByUsername(messageDto.getSender());
        
        if (senderOptional.isEmpty()) {
            throw new RuntimeException("Sender not found: " + messageDto.getSender());
        }
        
        User sender = senderOptional.get();
        Message message = new Message();
        message.setContent(messageDto.getContent());
        message.setSender(sender);
        message.setType(messageDto.getType() != null ? messageDto.getType() : MessageType.CHAT);
        message.setChatRoom(messageDto.getChatRoom());
        message.setTimestamp(LocalDateTime.now());
        
        if (messageDto.getReceiver() != null && !messageDto.getReceiver().isEmpty()) {
            Optional<User> receiverOptional = userRepository.findByUsername(messageDto.getReceiver());
            if (receiverOptional.isPresent()) {
                message.setReceiver(receiverOptional.get());
            }
        }
        
        return messageRepository.save(message);
    }
	
	public List<MessageDto> getChatRoomMessages(String chatRoom) {
	    List<Message> messages = messageRepository.findByChatRoomOrderByTimestampAsc(chatRoom);
	    List<MessageDto> dtos = new ArrayList<>();

	    for (Message message : messages) {
	        dtos.add(convertToDto(message));
	    }

	    return dtos;
	}
	
	public List<MessageDto> getPrivateMessages(String user1, String user2) {
	    Optional<User> userOptional1 = userRepository.findByUsername(user1);
	    Optional<User> userOptional2 = userRepository.findByUsername(user2);

	    if (userOptional1.isEmpty() || userOptional2.isEmpty()) {
	        throw new RuntimeException("One or both users not found");
	    }

	    List<Message> messages = messageRepository.findPrivateMessages(
	            userOptional1.get(), userOptional2.get());

	    List<MessageDto> dtos = new ArrayList<>();
	    for (Message message : messages) {
	        dtos.add(convertToDto(message));
	    }
	    return dtos;
	}
	
	public List<MessageDto> getRecentMessages(String username, int limit) {
	    Optional<User> userOptional = userRepository.findByUsername(username);
	    if (userOptional.isEmpty()) {
	        throw new RuntimeException("User not found: " + username);
	    }

	    List<MessageDto> allMessages = getChatRoomMessages("public");
	    List<MessageDto> recentMessages = new ArrayList<>();

	    for (int i = 0; i < Math.min(limit, allMessages.size()); i++) {
	        recentMessages.add(allMessages.get(i));
	    }

	    return recentMessages;
	}
	
	public MessageDto convertToDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setContent(message.getContent());
        dto.setSender(message.getSender().getUsername());
        dto.setType(message.getType());
        dto.setTimestamp(message.getTimestamp());
        dto.setChatRoom(message.getChatRoom());
        
        if (message.getReceiver() != null) {
            dto.setReceiver(message.getReceiver().getUsername());
        }
        
        return dto;
    }
    
    public void deleteMessage(Long messageId, String username) {
        Optional<Message> messageOptional = messageRepository.findById(messageId);
        if (messageOptional.isPresent()) {
            Message message = messageOptional.get();
            if (message.getSender().getUsername().equals(username)) {
                messageRepository.delete(message);
            } else {
                throw new RuntimeException("You can only delete your own messages!");
            }
        } else {
            throw new RuntimeException("Message not found!");
        }
    }
    
    public Message updateMessage(Long messageId, String newContent, String username) {
        Optional<Message> messageOptional = messageRepository.findById(messageId);
        if (messageOptional.isPresent()) {
            Message message = messageOptional.get();
            if (message.getSender().getUsername().equals(username)) {
                message.setContent(newContent);
                return messageRepository.save(message);
            } else {
                throw new RuntimeException("You can only edit your own messages!");
            }
        } else {
            throw new RuntimeException("Message not found!");
        }
    }




}
