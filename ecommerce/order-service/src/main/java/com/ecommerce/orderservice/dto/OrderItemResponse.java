package com.ecommerce.orderservice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String brand;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subTotal;
}