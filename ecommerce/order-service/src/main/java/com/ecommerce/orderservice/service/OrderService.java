package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.client.InventoryClient;
import com.ecommerce.orderservice.dto.*;
import com.ecommerce.orderservice.entity.Order;
import com.ecommerce.orderservice.entity.OrderItem;
import com.ecommerce.orderservice.entity.OrderStatus;
import com.ecommerce.orderservice.exception.ResourceNotFoundException;
import com.ecommerce.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;

    public OrderResponse createOrder(String userEmail, CreateOrderRequest request) {
        BigDecimal totalAmount = request.getItems()
                .stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Reserve stock for every item before persisting the order.
        // If any reservation fails, already-reserved items are rolled back.
        reserveStock(request.getItems());

        Order order = Order.builder()
                .userEmail(userEmail)
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .status(OrderStatus.PENDING)
                .totalAmount(totalAmount)
                .createdAt(LocalDateTime.now())
                .build();

        List<OrderItem> items = request.getItems().stream()
                .map(itemRequest -> {
                    BigDecimal subTotal = itemRequest.getPrice()
                            .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

                    return OrderItem.builder()
                            .productId(itemRequest.getProductId())
                            .productName(itemRequest.getProductName())
                            .brand(itemRequest.getBrand())
                            .price(itemRequest.getPrice())
                            .quantity(itemRequest.getQuantity())
                            .subTotal(subTotal)
                            .order(order)
                            .build();
                })
                .toList();

        order.setItems(items);

        try {
            Order savedOrder = orderRepository.save(order);
            return mapToResponse(savedOrder);
        } catch (RuntimeException ex) {
            // Persisting failed after stock was reserved — release it back.
            for (OrderItemRequest item : request.getItems()) {
                safeRelease(item.getProductId(), item.getQuantity());
            }
            throw ex;
        }
    }

    public List<OrderResponse> getMyOrders(String userEmail) {
        return orderRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public OrderResponse getMyOrderById(String userEmail, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUserEmail().equals(userEmail)) {
            throw new ResourceNotFoundException("Order not found");
        }

        return mapToResponse(order);
    }

    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        validateStatusTransition(order.getStatus(), request.getStatus());

        // Stock side effects of a status change:
        //  - SHIPPED    -> deduct reserved stock permanently
        //  - CANCELLED  -> release the reservation back to available
        if (request.getStatus() == OrderStatus.SHIPPED) {
            deductStock(order.getItems());
        } else if (request.getStatus() == OrderStatus.CANCELLED) {
            releaseStock(order.getItems());
        }

        order.setStatus(request.getStatus());
        Order savedOrder = orderRepository.save(order);

        return mapToResponse(savedOrder);
    }

    public OrderResponse cancelMyOrder(String userEmail, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUserEmail().equals(userEmail)) {
            throw new ResourceNotFoundException("Order not found");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Order is already cancelled");
        }

        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Order cannot be cancelled at this stage");
        }

        // Reserved stock (order was PENDING/CONFIRMED) goes back to available.
        releaseStock(order.getItems());

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        return mapToResponse(savedOrder);
    }

    // ---- inventory helpers ----

    private void reserveStock(List<OrderItemRequest> items) {
        List<OrderItemRequest> reserved = new ArrayList<>();
        for (OrderItemRequest item : items) {
            try {
                inventoryClient.reserve(item.getProductId(), item.getQuantity());
                reserved.add(item);
            } catch (RuntimeException ex) {
                // Roll back reservations made so far, then surface the failure.
                for (OrderItemRequest done : reserved) {
                    safeRelease(done.getProductId(), done.getQuantity());
                }
                throw ex;
            }
        }
    }

    private void deductStock(List<OrderItem> items) {
        for (OrderItem item : items) {
            inventoryClient.deduct(item.getProductId(), item.getQuantity());
        }
    }

    private void releaseStock(List<OrderItem> items) {
        for (OrderItem item : items) {
            safeRelease(item.getProductId(), item.getQuantity());
        }
    }

    /** Best-effort release; never masks the original operation's outcome. */
    private void safeRelease(Long productId, int quantity) {
        try {
            inventoryClient.release(productId, quantity);
        } catch (RuntimeException ignored) {
            // Intentionally swallowed — this is a compensating action.
        }
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.CANCELLED || current == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Status cannot be changed from " + current);
        }

        if (current == OrderStatus.PENDING &&
                !(next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED)) {
            throw new IllegalArgumentException("Invalid status transition from PENDING to " + next);
        }

        if (current == OrderStatus.CONFIRMED &&
                !(next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED)) {
            throw new IllegalArgumentException("Invalid status transition from CONFIRMED to " + next);
        }

        if (current == OrderStatus.SHIPPED &&
                next != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Invalid status transition from SHIPPED to " + next);
        }
    }

    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userEmail(order.getUserEmail())
                .fullName(order.getFullName())
                .phoneNumber(order.getPhoneNumber())
                .addressLine1(order.getAddressLine1())
                .addressLine2(order.getAddressLine2())
                .city(order.getCity())
                .state(order.getState())
                .country(order.getCountry())
                .postalCode(order.getPostalCode())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(item ->
                        OrderItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProductId())
                                .productName(item.getProductName())
                                .brand(item.getBrand())
                                .price(item.getPrice())
                                .quantity(item.getQuantity())
                                .subTotal(item.getSubTotal())
                                .build()
                ).toList())
                .build();
    }
}
