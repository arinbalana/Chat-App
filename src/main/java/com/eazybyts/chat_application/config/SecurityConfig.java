package com.eazybyts.chat_application.config;

import com.eazybyts.chat_application.service.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(@Lazy JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   UserDetailsService userDetailsService,
                                                   JwtService jwtService) throws Exception {

        http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**", "/api/auth/register").permitAll()
            .requestMatchers("/ws/**", "/sockjs/**").permitAll()
            .requestMatchers("/", "/index.html", "/login.html", "/register.html", "/chat.html").permitAll()
            .requestMatchers("/css/**", "/js/**", "/images/**", "/assets/**").permitAll()
            .requestMatchers("/favicon.ico").permitAll()
            .requestMatchers("/error").permitAll()
            .anyRequest().authenticated()
        );


        // Add our JWT filter BEFORE the UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
        
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}


//import java.io.IOException;
//import java.util.ArrayList;
//import java.util.Optional;
//
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
//import org.springframework.security.config.http.SessionCreationPolicy;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import com.eazybyts.chat_application.model.User;
//import com.eazybyts.chat_application.service.JwtService;
//import com.eazybyts.chat_application.service.UserService;
//
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//
//@Configuration
//@EnableWebSecurity
//public class SecurityConfig {
//
//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return new BCryptPasswordEncoder();
//    }
//
//    @Bean
//    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
//        return config.getAuthenticationManager();
//    }
//
//    @Bean
//    public UserDetailsService userDetailsService(UserService userService) {
//        return username -> {
//            Optional<User> userOptional = userService.findByUsername(username);
//            if (userOptional.isEmpty()) {
//                throw new UsernameNotFoundException("User not found with username: " + username);
//            }
//            User user = userOptional.get();
//            return org.springframework.security.core.userdetails.User.builder()
//                    .username(user.getUsername())
//                    .password(user.getPassword())
//                    .authorities(new ArrayList<>()) // map roles to authorities here when available
//                    .accountExpired(false)
//                    .accountLocked(false)
//                    .credentialsExpired(false)
//                    .disabled(false)
//                    .build();
//        };
//    }
//
//    @Bean
//    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
//        return new JwtAuthenticationFilter(jwtService, userDetailsService);
//    }
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
//        http
//            .csrf(csrf -> csrf.disable())
//            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//            .authorizeHttpRequests(auth -> auth
//                .requestMatchers("/api/auth/**").permitAll()
//                .requestMatchers("/ws/**").permitAll()
//                .requestMatchers("/", "/index.html", "/login.html", "/register.html", "/chat.html").permitAll()
//                .requestMatchers("/css/**", "/js/**", "/images/**", "/assets/**").permitAll()
//                .requestMatchers("/favicon.ico").permitAll()
//                .anyRequest().authenticated()
//            );
//
//        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
//
//        return http.build();
//    }
//
//    public static class JwtAuthenticationFilter extends OncePerRequestFilter {
//
//        private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
//
//        private final JwtService jwtService;
//        private final UserDetailsService userDetailsService;
//
//        public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
//            this.jwtService = jwtService;
//            this.userDetailsService = userDetailsService;
//        }
//
//        @Override
//        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
//                                        FilterChain filterChain) throws ServletException, IOException {
//
//            String header = request.getHeader("Authorization");
//            String username = null;
//            String token = null;
//
//            if (header != null && header.startsWith("Bearer ")) {
//                token = header.substring(7).trim();
//                try {
//                    username = jwtService.getUsernameFromToken(token);
//                } catch (Exception ex) {
//                    logger.debug("Failed to parse JWT token: {}", ex.getMessage());
//                }
//            }
//
//            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
//                try {
//                    if (jwtService.validateToken(token)) {
//                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
//
//                        UsernamePasswordAuthenticationToken authentication =
//                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//
//                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
//                        SecurityContextHolder.getContext().setAuthentication(authentication);
//                    }
//                } catch (UsernameNotFoundException ex) {
//                    logger.debug("User not found during JWT authentication: {}", ex.getMessage());
//                } catch (Exception ex) {
//                    logger.debug("JWT validation exception: {}", ex.getMessage());
//                }
//            }
//
//            filterChain.doFilter(request, response);
//        }
//    }
//}
