package com.eazybyts.chat_application.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ------------------------
        // RECOMMENDED: Explicit origins
        // Replace these with your actual frontend origins (no wildcard "*")
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ));
        // ------------------------

        // If you must accept many origins and still use credentials,
        // uncomment the following and comment out setAllowedOrigins above:
        // config.setAllowedOriginPatterns(List.of("*"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        // If your frontend sends cookies or uses credentials (Authorization header with cookies),
        // keep this true. If not, set to false.
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // apply to all endpoints
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
