package com.eazybyts.chat_application.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.eazybyts.chat_application.dto.MessageDto;
import com.eazybyts.chat_application.model.Message;
import com.eazybyts.chat_application.model.MessageType;
import com.eazybyts.chat_application.service.ChatService;
import com.eazybyts.chat_application.service.UserService;

@Controller
public class ChatController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserService userService;
    
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public MessageDto sendMessage(@Payload MessageDto messageDto) {
        try {
            if (messageDto.getChatRoom() == null || messageDto.getChatRoom().isEmpty()) {
                messageDto.setChatRoom("public");
            }
            
            Message savedMessage = chatService.saveMessage(messageDto);
            return chatService.convertToDto(savedMessage);
            
        } catch (Exception e) {
            MessageDto errorMessage = new MessageDto();
            errorMessage.setContent("Failed to send message: " + e.getMessage());
            errorMessage.setSender("System");
            errorMessage.setType(MessageType.CHAT);
            return errorMessage;
        }
    }
    
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public MessageDto addUser(@Payload MessageDto messageDto, 
                             SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", messageDto.getSender());
        userService.setUserOnlineStatus(messageDto.getSender(), true);
        
        messageDto.setType(MessageType.JOIN);
        messageDto.setContent(messageDto.getSender() + " joined the chat!");
        
        return messageDto;
    }
    
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload MessageDto messageDto) {
        try {
            Message savedMessage = chatService.saveMessage(messageDto);
            MessageDto responseDto = chatService.convertToDto(savedMessage);
            
            messagingTemplate.convertAndSendToUser(
                messageDto.getReceiver(), 
                "/queue/private", 
                responseDto
            );
            
            messagingTemplate.convertAndSendToUser(
                messageDto.getSender(), 
                "/queue/private", 
                responseDto
            );
            
        } catch (Exception e) {
            MessageDto errorMessage = new MessageDto();
            errorMessage.setContent("Failed to send private message: " + e.getMessage());
            errorMessage.setSender("System");
            errorMessage.setType(MessageType.CHAT);
            
            messagingTemplate.convertAndSendToUser(
                messageDto.getSender(), 
                "/queue/private", 
                errorMessage
            );
        }
    }
    
    @GetMapping("/api/messages/room/{roomName}")
    @ResponseBody
    public ResponseEntity<List<MessageDto>> getRoomMessages(@PathVariable String roomName) {
        try {
            List<MessageDto> messages = chatService.getChatRoomMessages(roomName);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/api/messages/private")
    @ResponseBody
    public ResponseEntity<List<MessageDto>> getPrivateMessages(
            @RequestParam String user1, 
            @RequestParam String user2) {
        try {
            List<MessageDto> messages = chatService.getPrivateMessages(user1, user2);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/api/messages/recent/{username}")
    @ResponseBody
    public ResponseEntity<List<MessageDto>> getRecentMessages(
            @PathVariable String username,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            List<MessageDto> messages = chatService.getRecentMessages(username, limit);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/api/messages/{messageId}")
    @ResponseBody
    public ResponseEntity<?> deleteMessage(@PathVariable Long messageId, 
                                         @RequestParam String username) {
        try {
            chatService.deleteMessage(messageId, username);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Message deleted successfully!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PutMapping("/api/messages/{messageId}")
    @ResponseBody
    public ResponseEntity<?> updateMessage(@PathVariable Long messageId,
                                         @RequestParam String content,
                                         @RequestParam String username) {
        try {
            Message updatedMessage = chatService.updateMessage(messageId, content, username);
            MessageDto messageDto = chatService.convertToDto(updatedMessage);
            return ResponseEntity.ok(messageDto);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
