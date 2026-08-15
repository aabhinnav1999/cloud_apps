package com.ecommerce.orderservice.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * HTTP client for the notification-service.
 *
 * Sending a notification is best-effort: a failure here (service down, bad
 * response) is logged and swallowed so it never fails the order operation.
 *
 * notification-service:
 *   POST /api/notifications/
 *   body: { userId, orderId, type, channel, title, message }
 *
 * userId is the customer's email (the identity carried in the order JWT).
 */
@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final RestClient restClient;

    public NotificationClient(@Value("${notification.base-url:http://localhost:8086}") String baseUrl,
                              ClientHttpRequestFactory requestFactory) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public void send(String userEmail, Long orderId, String type, String title, String message) {
        try {
            restClient.post()
                    .uri("/api/notifications/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "userId", userEmail,
                            "orderId", String.valueOf(orderId),
                            "type", type,
                            "channel", "APP",
                            "title", title,
                            "message", message))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException ex) {
            log.warn("Failed to send '{}' notification for order {}: {}", type, orderId, ex.getMessage());
        }
    }
}
