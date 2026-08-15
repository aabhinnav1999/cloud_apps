package com.ecommerce.orderservice.client;

import com.ecommerce.orderservice.exception.InventoryServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

/**
 * HTTP client for the inventory-service stock operations.
 *
 * Endpoints (inventory-service):
 *   POST /api/inventory/{productId}/reserve
 *   POST /api/inventory/{productId}/release
 *   POST /api/inventory/{productId}/deduct
 * Body: { "quantity": <int> }
 */
@Component
public class InventoryClient {

    private final RestClient restClient;

    public InventoryClient(@Value("${inventory.base-url:http://localhost:8084}") String baseUrl,
                           ClientHttpRequestFactory requestFactory) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public void reserve(Long productId, int quantity) {
        execute(productId, "reserve", quantity);
    }

    public void release(Long productId, int quantity) {
        execute(productId, "release", quantity);
    }

    public void deduct(Long productId, int quantity) {
        execute(productId, "deduct", quantity);
    }

    private void execute(Long productId, String action, int quantity) {
        try {
            restClient.post()
                    .uri("/api/inventory/{productId}/{action}", productId, action)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("quantity", quantity))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is5xxServerError()) {
                throw new InventoryServiceException(
                        "Inventory service error during " + action + " for product " + productId);
            }
            // 4xx -> business error (insufficient stock, no inventory record, etc.)
            throw new IllegalArgumentException(
                    "Inventory " + action + " failed for product " + productId + ": "
                            + extractDetail(ex.getResponseBodyAsString()));
        } catch (ResourceAccessException ex) {
            throw new InventoryServiceException(
                    "Inventory service is unavailable. Please try again later.");
        }
    }

    /** Pull the "detail" message out of a FastAPI error body like {"detail":"..."}. */
    private String extractDetail(String body) {
        if (body == null || body.isBlank()) {
            return "unknown error";
        }
        int keyIdx = body.indexOf("\"detail\"");
        if (keyIdx >= 0) {
            int colon = body.indexOf(':', keyIdx);
            int start = body.indexOf('"', colon + 1);
            int end = body.indexOf('"', start + 1);
            if (start >= 0 && end > start) {
                return body.substring(start + 1, end);
            }
        }
        return body;
    }
}
