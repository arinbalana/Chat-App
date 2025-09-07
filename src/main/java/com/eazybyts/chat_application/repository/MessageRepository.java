package com.eazybyts.chat_application.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.eazybyts.chat_application.model.Message;
import com.eazybyts.chat_application.model.User;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long>{
	List<Message> findByChatRoomOrderByTimestampAsc(String chatRoom);
	
	@Query("SELECT m FROM Message m WHERE " +
	           "(m.sender = :user1 AND m.receiver = :user2) OR " +
	           "(m.sender = :user2 AND m.receiver = :user1) " +
	           "ORDER BY m.timestamp ASC")
	List<Message> findPrivateMessages(@Param("user1") User user1, @Param("user2") User user2);
	
	List<Message> findTop50ByChatRoomOrderByTimestampDesc(String chatRoom);
}
