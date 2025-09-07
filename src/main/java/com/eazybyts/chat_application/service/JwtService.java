package com.eazybyts.chat_application.service;

import java.security.Key;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.MacAlgorithm;

@Service
public class JwtService {
	@Value("${jwt.secret}")
	private String jwtSecret;
	
	@Value("${jwt.expiration}")
	private int jwtExpirationMs;
	
	private static final MacAlgorithm ALG = Jwts.SIG.HS512;
	
	public String generateToken(String username) {
		return Jwts.builder()
				.subject(username)
				.issuedAt(new Date())
				.expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
				.signWith(getSigningKey(), ALG)
				.compact();
	}
	
	
	public Date getExpirationDateFromToken(String token) {
        Claims claims = Jwts.parser()
        		.verifyWith(getSigningKey())
        		.build()
        		.parseSignedClaims(token)
	            .getPayload();
        return claims.getExpiration();
    }
	
	public String getUsernameFromToken(String token) {
	    Claims claims = Jwts.parser()
	            .verifyWith(getSigningKey())
	            .build()
	            .parseSignedClaims(token)
	            .getPayload();
	    return claims.getSubject();
	}
	
	private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }
	
	public boolean validateToken(String authToken) {
		try {
			Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(authToken);
			return true;
		}catch(JwtException | IllegalArgumentException e) {
			return false;
		}
	}
	
	public boolean isTokenValid(String token, UserDetails userDetails) {
	    if (token == null || userDetails == null) return false;
	    String username = getUsernameFromToken(token); // your existing method
	    if (username == null) return false;
	    if (!username.equals(userDetails.getUsername())) return false;
	    // if you have isTokenExpired(token) use it; otherwise adapt to your expiration checker
	    try {
	        return !isTokenExpired(token); // your existing method that checks expiry
	    } catch (Exception e) {
	        // fallback conservative: token invalid on exception
	        return false;
	    }
	}

	
	private SecretKey getSigningKey() {
		byte[] keyBytes = jwtSecret.getBytes();
		return Keys.hmacShaKeyFor(keyBytes);
	}

}
