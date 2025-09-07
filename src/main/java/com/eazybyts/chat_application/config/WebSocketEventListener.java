package com.eazybyts.chat_application.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.eazybyts.chat_application.dto.MessageDto;
import com.eazybyts.chat_application.model.MessageType;
import com.eazybyts.chat_application.service.UserService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private UserService userService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("Received a new web socket connection");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            logger.info("User Disconnected: " + username);

            userService.setUserOnlineStatus(username, false);

            MessageDto chatMessage = new MessageDto();
            chatMessage.setType(MessageType.LEAVE);
            chatMessage.setSender(username);
            chatMessage.setContent(username + " left the chat!");

            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}
