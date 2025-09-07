package com.eazybyts.chat_application.dto;

import java.time.LocalDateTime;

import com.eazybyts.chat_application.model.MessageType;

public class MessageDto {
    private String content;
    private String sender;
    private String receiver;
    private MessageType type;
    private LocalDateTime timestamp;
    private String chatRoom;
    
    public MessageDto() {
        this.timestamp = LocalDateTime.now();
    }
    
    public MessageDto(String content, String sender, MessageType type) {
        this();
        this.content = content;
        this.sender = sender;
        this.type = type;
    }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    
    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }
    
    public MessageType getType() { return type; }
    public void setType(MessageType type) { this.type = type; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getChatRoom() { return chatRoom; }
    public void setChatRoom(String chatRoom) { this.chatRoom = chatRoom; }
}
