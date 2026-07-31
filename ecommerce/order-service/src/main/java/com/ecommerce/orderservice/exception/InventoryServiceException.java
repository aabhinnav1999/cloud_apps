package com.ecommerce.orderservice.exception;

/**
 * Thrown when the inventory-service is unreachable or returns a server error
 * while reserving / releasing / deducting stock. Maps to HTTP 502.
 */
public class InventoryServiceException extends RuntimeException {
    public InventoryServiceException(String message) {
        super(message);
    }
}
